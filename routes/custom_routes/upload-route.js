import { Router } from "express";
import { upload } from "../../middlewares/multer.middleware.js";
import { uploadImage } from "../../controllers/upload-controller.js";

const uploadRouter = () => {
  const router = Router();
  router.post("/upload", upload.single("image"), uploadImage);
  return router;
};

export default uploadRouter;
