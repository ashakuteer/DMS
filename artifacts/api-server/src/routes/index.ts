import { Router, type IRouter } from "express";
import healthRouter from "./health";
import donorsRouter from "./donors";
import donationsRouter from "./donations";
import beneficiariesRouter from "./beneficiaries";
import sponsorshipsRouter from "./sponsorships";
import reportsRouter from "./reports";
import communicationsRouter from "./communications";
import timemachineRouter from "./timemachine";

const router: IRouter = Router();

router.use(healthRouter);
router.use(donorsRouter);
router.use(donationsRouter);
router.use(beneficiariesRouter);
router.use(sponsorshipsRouter);
router.use(reportsRouter);
router.use(communicationsRouter);
router.use(timemachineRouter);

export default router;
