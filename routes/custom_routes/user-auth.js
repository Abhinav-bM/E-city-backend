import { userLogin } from "../../controllers/user-authController.js";

const userRouter = (router) => {
  router.post("/login", userLogin);
  return router;
};

export default userRouter;
