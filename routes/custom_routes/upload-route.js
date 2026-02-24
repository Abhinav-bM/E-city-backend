import { Router } from "express";
import { upload } from "../../middlewares/multer.middleware.js";
import { uploadImage } from "../../controllers/upload-controller.js";
import { requireAuth, requireAdmin } from "../../middlewares/auth.js";

const uploadRouter = () => {
  const router = Router();
  router.post(
    "/upload",
    requireAuth,
    requireAdmin,
    upload.single("image"),
    uploadImage,
  );
  return router;
};

export default uploadRouter;
