import { env } from "#common/config";
import { getMongoDb } from "#common/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type AdminRole = "superadmin" | "admin";

type AdminJwtPayload = {
  sub: string;
  role: AdminRole;
  tokenType: "access" | "refresh";
};

type SessionRecord = {
  tokenHash: string;
  email: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  ip: string;
  userAgent: string;
};

type AdminUserRecord = {
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

type AuditRecord = {
  action: string;
  email: string;
  createdAt: Date;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
};

const ACCESS_TOKEN_TTL_SEC = 15 * 60;
const REFRESH_TOKEN_TTL_SEC = 30 * 24 * 60 * 60;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const safeStringEqual = (a: string, b: string) => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
};

const sanitizeTotpCode = (code: string | undefined) => String(code || "").replace(/\s+/g, "").trim();

const base32ToBuffer = (value: string) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = value.toUpperCase().replace(/[^A-Z2-7]/g, "");

  let bits = "";
  for (const char of cleaned) {
    const index = alphabet.indexOf(char);
    if (index < 0) {
      continue;
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
};

export class AdminAuthService {
  private memorySessions = new Map<string, SessionRecord>();
  private memoryAuditLogs: AuditRecord[] = [];
  private memoryUsers = new Map<string, AdminUserRecord>();
  private indexesEnsured = false;

  private getJwtSecret() {
    return env.JWT_SECRET || env.ADMIN_TOKEN || "dev-admin-jwt-secret";
  }

  private getRefreshJwtSecret() {
    return env.REFRESH_TOKEN_SECRET || env.JWT_SECRET || env.ADMIN_TOKEN || "dev-admin-refresh-secret";
  }

  private hasMongo() {
    return Boolean(env.MONGODB_URI && env.MONGODB_DB_NAME);
  }

  isTwoFactorEnabled() {
    return Boolean(env.ADMIN_TOTP_SECRET);
  }

  private generateTotp(secret: string, unixTimeSeconds: number) {
    const counter = Math.floor(unixTimeSeconds / TOTP_PERIOD_SECONDS);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const key = base32ToBuffer(secret);
    if (!key.length) {
      return "";
    }

    const digest = createHmac("sha1", key).update(counterBuffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binaryCode =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    const otp = binaryCode % 10 ** TOTP_DIGITS;
    return String(otp).padStart(TOTP_DIGITS, "0");
  }

  private verifyTotp(code: string | undefined) {
    const secret = env.ADMIN_TOTP_SECRET;
    if (!secret) {
      return true;
    }

    const normalizedCode = sanitizeTotpCode(code);
    if (!/^\d{6}$/.test(normalizedCode)) {
      return false;
    }

    const unixTime = Math.floor(Date.now() / 1000);
    const windows = [-1, 0, 1];

    return windows.some((windowOffset) => {
      const expected = this.generateTotp(secret, unixTime + windowOffset * TOTP_PERIOD_SECONDS);
      return expected.length > 0 && safeStringEqual(expected, normalizedCode);
    });
  }

  private async ensureIndexes() {
    if (!this.hasMongo() || this.indexesEnsured) {
      return;
    }

    const db = await getMongoDb();
    await db.collection<SessionRecord>("admin_sessions").createIndexes([
      { key: { tokenHash: 1 }, unique: true },
      { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
      { key: { email: 1, revokedAt: 1 } },
    ]);

    await db.collection<AuditRecord>("audit_logs").createIndex({ createdAt: -1 });
    await db.collection<AdminUserRecord>("admin_users").createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { role: 1, isActive: 1 } },
    ]);
    this.indexesEnsured = true;
  }

  private normalizeEmail(value: string) {
    return String(value || "").trim().toLowerCase();
  }

  private async ensureBootstrapAdmin() {
    const bootstrapEmail = this.normalizeEmail(env.ADMIN_EMAIL || "");
    const bootstrapPasswordHash = env.ADMIN_PASSWORD_HASH;
    const bootstrapPassword = env.ADMIN_PASSWORD;

    if (!bootstrapEmail || (!bootstrapPasswordHash && !bootstrapPassword)) {
      return;
    }

    if (!this.hasMongo()) {
      const existing = this.memoryUsers.get(bootstrapEmail);

      let resolvedHash = bootstrapPasswordHash || "";
      if (!resolvedHash && bootstrapPassword) {
        const matchesExisting = existing
          ? await bcrypt.compare(bootstrapPassword, existing.passwordHash)
          : false;
        resolvedHash = matchesExisting
          ? existing!.passwordHash
          : await bcrypt.hash(bootstrapPassword, 10);
      }

      if (!existing) {
        this.memoryUsers.set(bootstrapEmail, {
          email: bootstrapEmail,
          passwordHash: resolvedHash,
          role: "superadmin",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        });
      } else {
        this.memoryUsers.set(bootstrapEmail, {
          ...existing,
          passwordHash: resolvedHash,
          role: "superadmin",
          isActive: true,
          updatedAt: new Date(),
        });
      }
      return;
    }

    await this.ensureIndexes();
    const db = await getMongoDb();
    const existing = await db.collection<AdminUserRecord>("admin_users").findOne({ email: bootstrapEmail });

    let resolvedHash = bootstrapPasswordHash || "";
    if (!resolvedHash && bootstrapPassword) {
      const matchesExisting = existing
        ? await bcrypt.compare(bootstrapPassword, existing.passwordHash)
        : false;
      resolvedHash = matchesExisting
        ? existing!.passwordHash
        : await bcrypt.hash(bootstrapPassword, 10);
    }

    if (!existing) {
      await db.collection<AdminUserRecord>("admin_users").insertOne({
        email: bootstrapEmail,
        passwordHash: resolvedHash,
        role: "superadmin",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      });
      return;
    }

    await db.collection<AdminUserRecord>("admin_users").updateOne(
      { email: bootstrapEmail },
      {
        $set: {
          passwordHash: resolvedHash,
          role: "superadmin",
          isActive: true,
          updatedAt: new Date(),
        },
      },
    );
  }

  private async getUserByEmail(email: string) {
    const normalized = this.normalizeEmail(email);
    await this.ensureBootstrapAdmin();

    if (!this.hasMongo()) {
      return this.memoryUsers.get(normalized) || null;
    }

    const db = await getMongoDb();
    return db.collection<AdminUserRecord>("admin_users").findOne({ email: normalized });
  }

  private async updateLastLoginAt(email: string) {
    const normalized = this.normalizeEmail(email);
    const now = new Date();

    if (!this.hasMongo()) {
      const user = this.memoryUsers.get(normalized);
      if (!user) return;
      this.memoryUsers.set(normalized, {
        ...user,
        lastLoginAt: now,
        updatedAt: now,
      });
      return;
    }

    const db = await getMongoDb();
    await db.collection<AdminUserRecord>("admin_users").updateOne(
      { email: normalized },
      { $set: { lastLoginAt: now, updatedAt: now } },
    );
  }

  private async validateAdminCredentials(email: string, password: string) {
    const user = await this.getUserByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  private createTokenPair(email: string, role: AdminRole) {
    const accessToken = jwt.sign(
      { role, tokenType: "access" },
      this.getJwtSecret(),
      {
        subject: email,
        expiresIn: ACCESS_TOKEN_TTL_SEC,
      },
    );

    const refreshToken = jwt.sign(
      { role, tokenType: "refresh" },
      this.getRefreshJwtSecret(),
      {
        subject: email,
        expiresIn: REFRESH_TOKEN_TTL_SEC,
      },
    );

    return {
      accessToken,
      refreshToken,
      role,
      accessTokenTtlSeconds: ACCESS_TOKEN_TTL_SEC,
      refreshTokenTtlSeconds: REFRESH_TOKEN_TTL_SEC,
    };
  }

  private getRefreshExpiryDate() {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000);
  }

  private async createSession(record: SessionRecord) {
    if (!this.hasMongo()) {
      this.memorySessions.set(record.tokenHash, record);
      return;
    }

    await this.ensureIndexes();
    const db = await getMongoDb();
    await db.collection<SessionRecord>("admin_sessions").insertOne(record);
  }

  private async revokeSession(tokenHash: string) {
    if (!this.hasMongo()) {
      const existing = this.memorySessions.get(tokenHash);
      if (!existing) return;
      this.memorySessions.set(tokenHash, { ...existing, revokedAt: new Date() });
      return;
    }

    const db = await getMongoDb();
    await db.collection<SessionRecord>("admin_sessions").updateOne(
      { tokenHash },
      { $set: { revokedAt: new Date() } },
    );
  }

  private async findActiveSession(tokenHash: string) {
    const now = new Date();

    if (!this.hasMongo()) {
      const session = this.memorySessions.get(tokenHash);
      if (!session) return null;
      if (session.revokedAt) return null;
      if (session.expiresAt <= now) return null;
      return session;
    }

    const db = await getMongoDb();
    const session = await db.collection<SessionRecord>("admin_sessions").findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: now },
    });

    return session;
  }

  private async touchSession(tokenHash: string) {
    if (!this.hasMongo()) {
      const session = this.memorySessions.get(tokenHash);
      if (!session) return;
      this.memorySessions.set(tokenHash, { ...session, lastUsedAt: new Date() });
      return;
    }

    const db = await getMongoDb();
    await db.collection<SessionRecord>("admin_sessions").updateOne(
      { tokenHash },
      { $set: { lastUsedAt: new Date() } },
    );
  }

  async writeAuditLog(record: AuditRecord) {
    if (!this.hasMongo()) {
      this.memoryAuditLogs.unshift(record);
      this.memoryAuditLogs = this.memoryAuditLogs.slice(0, 200);
      return;
    }

    await this.ensureIndexes();
    const db = await getMongoDb();
    await db.collection<AuditRecord>("audit_logs").insertOne(record);
  }

  async getRecentAuditLogs(limit = 50) {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));

    if (!this.hasMongo()) {
      return this.memoryAuditLogs.slice(0, safeLimit);
    }

    const db = await getMongoDb();
    return db
      .collection<AuditRecord>("audit_logs")
      .find({}, { sort: { createdAt: -1 }, limit: safeLimit })
      .toArray();
  }

  async login({
    email,
    password,
    otp,
    ip,
    userAgent,
  }: {
    email: string;
    password: string;
    otp?: string;
    ip: string;
    userAgent: string;
  }) {
    const user = await this.validateAdminCredentials(email, password);
    const normalizedEmail = this.normalizeEmail(email);

    if (!user) {
      await this.writeAuditLog({
        action: "admin.login.failed",
        email: normalizedEmail,
        ip,
        userAgent,
        createdAt: new Date(),
      });
      return { ok: false as const, reason: "invalid_credentials" as const };
    }

    if (this.isTwoFactorEnabled()) {
      if (!sanitizeTotpCode(otp)) {
        await this.writeAuditLog({
          action: "admin.login.2fa.required",
          email: normalizedEmail,
          ip,
          userAgent,
          createdAt: new Date(),
        });

        return { ok: false as const, reason: "totp_required" as const };
      }

      const totpValid = this.verifyTotp(otp);
      if (!totpValid) {
        await this.writeAuditLog({
          action: "admin.login.2fa.failed",
          email: normalizedEmail,
          ip,
          userAgent,
          createdAt: new Date(),
        });

        return { ok: false as const, reason: "totp_invalid" as const };
      }
    }

    const tokens = this.createTokenPair(normalizedEmail, user.role);
    const refreshTokenHash = sha256(tokens.refreshToken);

    await this.createSession({
      tokenHash: refreshTokenHash,
      email: normalizedEmail,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: this.getRefreshExpiryDate(),
      revokedAt: null,
      ip,
      userAgent,
    });

    await this.writeAuditLog({
      action: "admin.login.success",
      email: normalizedEmail,
      ip,
      userAgent,
      createdAt: new Date(),
    });

    await this.updateLastLoginAt(normalizedEmail);

    return {
      ok: true as const,
      tokens,
    };
  }

  verifyAccessToken(token: string | undefined) {
    if (!token) return null;

    try {
      const payload = jwt.verify(token, this.getJwtSecret()) as AdminJwtPayload;
      if (!["admin", "superadmin"].includes(String(payload?.role || "")) || payload?.tokenType !== "access") {
        return null;
      }

      return {
        email: payload.sub,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }

  async refresh(refreshToken: string, ip: string, userAgent: string) {
    let payload: AdminJwtPayload;

    try {
      payload = jwt.verify(refreshToken, this.getRefreshJwtSecret()) as AdminJwtPayload;
    } catch {
      return null;
    }

    if (!payload?.role || payload?.tokenType !== "refresh" || !payload?.sub) {
      return null;
    }

    const refreshTokenHash = sha256(refreshToken);
    const session = await this.findActiveSession(refreshTokenHash);

    if (!session) {
      return null;
    }

    await this.revokeSession(refreshTokenHash);

    const tokens = this.createTokenPair(payload.sub, payload.role);
    const nextRefreshTokenHash = sha256(tokens.refreshToken);

    await this.createSession({
      tokenHash: nextRefreshTokenHash,
      email: payload.sub,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: this.getRefreshExpiryDate(),
      revokedAt: null,
      ip,
      userAgent,
    });

    await this.touchSession(nextRefreshTokenHash);

    await this.writeAuditLog({
      action: "admin.refresh.success",
      email: payload.sub,
      ip,
      userAgent,
      createdAt: new Date(),
    });

    return tokens;
  }

  async logout(refreshToken: string, ip: string, userAgent: string) {
    let payload: AdminJwtPayload | null = null;

    try {
      payload = jwt.verify(refreshToken, this.getRefreshJwtSecret()) as AdminJwtPayload;
    } catch {
      payload = null;
    }

    const refreshTokenHash = sha256(refreshToken);
    await this.revokeSession(refreshTokenHash);

    await this.writeAuditLog({
      action: "admin.logout",
      email: payload?.sub || "unknown",
      ip,
      userAgent,
      createdAt: new Date(),
    });

    return true;
  }

  async listSessions() {
    const now = new Date();

    if (!this.hasMongo()) {
      return [...this.memorySessions.values()]
        .filter((session) => session.expiresAt > now)
        .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime());
    }

    const db = await getMongoDb();
    return db
      .collection<SessionRecord>("admin_sessions")
      .find({ expiresAt: { $gt: now } }, { sort: { lastUsedAt: -1 }, limit: 200 })
      .toArray();
  }

  async revokeSessionByTokenHash(tokenHash: string) {
    const normalized = String(tokenHash || "").trim();
    if (!normalized) return false;

    if (!this.hasMongo()) {
      const existing = this.memorySessions.get(normalized);
      if (!existing || existing.revokedAt) return false;
      this.memorySessions.set(normalized, { ...existing, revokedAt: new Date() });
      return true;
    }

    const db = await getMongoDb();
    const result = await db.collection<SessionRecord>("admin_sessions").updateOne(
      { tokenHash: normalized, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return result.modifiedCount > 0;
  }

  async listAdminUsers() {
    await this.ensureBootstrapAdmin();

    if (!this.hasMongo()) {
      return [...this.memoryUsers.values()].map(({ passwordHash: _passwordHash, ...rest }) => rest);
    }

    const db = await getMongoDb();
    const users = await db.collection<AdminUserRecord>("admin_users").find({}, { sort: { createdAt: 1 } }).toArray();
    return users.map(({ passwordHash: _passwordHash, ...rest }) => rest);
  }

  async createAdminUser({
    email,
    password,
    role,
    isActive,
  }: {
    email: string;
    password: string;
    role: AdminRole;
    isActive?: boolean;
  }) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.ensureBootstrapAdmin();

    const existing = await this.getUserByEmail(normalizedEmail);
    if (existing) {
      return null;
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 10);
    const record: AdminUserRecord = {
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: isActive !== false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };

    if (!this.hasMongo()) {
      this.memoryUsers.set(normalizedEmail, record);
      const { passwordHash: _passwordHash, ...safe } = record;
      return safe;
    }

    const db = await getMongoDb();
    await db.collection<AdminUserRecord>("admin_users").insertOne(record);
    const { passwordHash: _passwordHash, ...safe } = record;
    return safe;
  }

  async updateAdminUser(
    email: string,
    patch: { password?: string; role?: AdminRole; isActive?: boolean },
  ) {
    const normalizedEmail = this.normalizeEmail(email);
    await this.ensureBootstrapAdmin();
    const now = new Date();

    if (!this.hasMongo()) {
      const existing = this.memoryUsers.get(normalizedEmail);
      if (!existing) return null;

      const nextPasswordHash = patch.password ? await bcrypt.hash(patch.password, 10) : existing.passwordHash;
      const updated: AdminUserRecord = {
        ...existing,
        passwordHash: nextPasswordHash,
        role: patch.role || existing.role,
        isActive: patch.isActive ?? existing.isActive,
        updatedAt: now,
      };

      this.memoryUsers.set(normalizedEmail, updated);
      const { passwordHash: _passwordHash, ...safe } = updated;
      return safe;
    }

    const setData: Record<string, unknown> = { updatedAt: now };
    if (patch.role) setData.role = patch.role;
    if (typeof patch.isActive === "boolean") setData.isActive = patch.isActive;
    if (patch.password) {
      setData.passwordHash = await bcrypt.hash(patch.password, 10);
    }

    const db = await getMongoDb();
    const result = await db.collection<AdminUserRecord>("admin_users").findOneAndUpdate(
      { email: normalizedEmail },
      { $set: setData },
      { returnDocument: "after" },
    );

    if (!result) return null;
    const { passwordHash: _passwordHash, ...safe } = result;
    return safe;
  }

  async deleteAdminUser(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const bootstrapEmail = this.normalizeEmail(env.ADMIN_EMAIL || "");

    if (normalizedEmail && bootstrapEmail && normalizedEmail === bootstrapEmail) {
      return { ok: false as const, reason: "bootstrap_protected" as const };
    }

    if (!this.hasMongo()) {
      const deleted = this.memoryUsers.delete(normalizedEmail);
      if (deleted) {
        return { ok: true as const };
      }

      return { ok: false as const, reason: "not_found" as const };
    }

    const db = await getMongoDb();
    const result = await db.collection<AdminUserRecord>("admin_users").deleteOne({ email: normalizedEmail });
    if (result.deletedCount > 0) {
      return { ok: true as const };
    }

    return { ok: false as const, reason: "not_found" as const };
  }

  async getSessionMetrics() {
    const now = new Date();

    if (!this.hasMongo()) {
      const activeSessions = [...this.memorySessions.values()].filter(
        (session) => !session.revokedAt && session.expiresAt > now,
      );
      return {
        activeSessionCount: activeSessions.length,
      };
    }

    const db = await getMongoDb();
    const activeSessionCount = await db.collection<SessionRecord>("admin_sessions").countDocuments({
      revokedAt: null,
      expiresAt: { $gt: now },
    });

    return {
      activeSessionCount,
    };
  }

  async getUsageSummary() {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (!this.hasMongo()) {
      const logs = [...this.memoryAuditLogs];
      const last24h = logs.filter((log) => new Date(log.createdAt) >= since24h);
      const failedLogins24h = last24h.filter((log) => log.action === "admin.login.failed").length;
      const uniqueIps24h = new Set(last24h.map((log) => log.ip || "unknown")).size;
      const activeSessionCount = (await this.getSessionMetrics()).activeSessionCount;

      return {
        totalAuditEvents: logs.length,
        events24h: last24h.length,
        failedLogins24h,
        uniqueIps24h,
        activeSessionCount,
      };
    }

    const db = await getMongoDb();

    const [
      totalAuditEvents,
      events24h,
      failedLogins24h,
      uniqueIpsDocs,
      activeSessionCount,
    ] = await Promise.all([
      db.collection<AuditRecord>("audit_logs").countDocuments({}),
      db.collection<AuditRecord>("audit_logs").countDocuments({ createdAt: { $gte: since24h } }),
      db.collection<AuditRecord>("audit_logs").countDocuments({
        action: "admin.login.failed",
        createdAt: { $gte: since24h },
      }),
      db
        .collection<AuditRecord>("audit_logs")
        .aggregate([{ $match: { createdAt: { $gte: since24h } } }, { $group: { _id: "$ip" } }])
        .toArray(),
      db.collection<SessionRecord>("admin_sessions").countDocuments({
        revokedAt: null,
        expiresAt: { $gt: now },
      }),
    ]);

    return {
      totalAuditEvents,
      events24h,
      failedLogins24h,
      uniqueIps24h: uniqueIpsDocs.length,
      activeSessionCount,
    };
  }
}
