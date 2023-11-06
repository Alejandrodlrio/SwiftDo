const express = require('express');
const router = express.Router();
const taskService = require('../services/taskService')

let task = {
    user_id: 1,
    context_id: 1,
    project_id: 1,
    title: "Crear tarea",
    description: "Intento de crear una nueva tarea para meter en la BD",
    state: "Initiate",
    verification_list: "",
    important_fixed: true,
    date_added: Date.now(),
    date_completed: Date.now(),
    date_limit: Date.now(),
    date_changed: Date.now(),
    num_version: 1
}

router.post('/newtask', async (req, res)=>{
    try{
        const data_task = req.body;
        const t = taskService.createTask(data_task);
        res.send(t);
    }catch(err){
        console.log('[Exception]:',err.message)
        res.sendStatus(404);
    }
})

router.post('/modifytask', async (req, res)=>{
  try{
      const data_task = req.body;
      const t = taskService.modificateTask(data_task);
      res.send(t);
  }catch(err){
      console.log('[Exception]:',err.message)
      res.sendStatus(404);
  }
})

router.get('/:id', async (req, res)=>{
    const id = req.params.id;
    console.log(id);
  
    try {
      const task = await taskService.findTaskById(id);
      res.send(task);
    } catch (error) {
      console.log('[Exception]:',error.message)
      res.sendStatus(404);
    }
  })

  router.get('/taskByUserId/:id', async (req, res)=>{
    const id = req.params.id;
    console.log(id);
  
    try {
      const task = await taskService.findTaskByUserId(id);
      res.send(task);
    } catch (error) {
      console.log('[Exception]:',error.message)
      res.sendStatus(404);
    }
  })
  
  module.exports = router;
  