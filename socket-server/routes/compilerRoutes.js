const express=require("express");

const router=express.Router();

const controller=require("../controllers/compilerController");

router.post("/run",controller.run);

module.exports=router;