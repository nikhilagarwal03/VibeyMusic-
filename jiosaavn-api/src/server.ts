import {
  AlbumController,
  AdminController,
  ArtistController,
  PlaylistController,
  SearchController,
  SongController,
} from "#modules/index";
import { warmupMongoConnection } from "#common/db";
import { App } from "./app";

const app = new App([
  new SearchController(),
  new SongController(),
  new AlbumController(),
  new ArtistController(),
  new PlaylistController(),
  new AdminController(),
]).getApp();

void warmupMongoConnection()
  .then((connected) => {
    if (connected) {
      console.log("[startup] MongoDB connection ready");
    }
  })
  .catch((error) => {
    console.error("[startup] MongoDB warmup failed:", error);
  });

export default app;
