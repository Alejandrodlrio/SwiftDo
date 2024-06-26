import React, { useState, useEffect, useContext } from "react";
import taskService from "../../services/task/taskService";
import projectService from "../../services/project/projectService";
import { View, Text, Animated, TextInput, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, SafeAreaView, Dimensions, useColorScheme, ActivityIndicator } from "react-native";
import { FontAwesome5, Entypo, FontAwesome, MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { NativeBaseProvider, VStack, Box, Menu, extendTheme, Icon } from "native-base";
import TaskList from "./TaskList";
import AddButton from "../../components/common/addButton";
import MoveTaskModal from "../../components/modals/MoveTaskModal";
import CreateTaskModal from "../../components/modals/CreateTaskModal";
import CreateProjectModal from "../../components/modals/CreateProjectModal";
import AuthContext from '../../services/auth/context/authContext';
import LoadingIndicator from "../../components/LoadingIndicator";
import AddTypeModal from "../../components/modals/AddTypeModal";
import CompleteTaskModal from "../../components/modals/CompleteTaskModal";
import FilterModal from "../../components/modals/FilterModal";
import styles from "./actionScreen.styles";
import Colors from "../../styles/colors";
import FilterContext from "../../services/filters/FilterContext";
import ContextBadge from "../../components/common/ContextBadge";
import deviceStorage from "../../offline/deviceStorage";
import OfflineContext from "../../offline/offlineContext/OfflineContext";
import ThemeContext from "../../services/theme/ThemeContext";
import SettingsModal from "../../components/modals/settings/SettingsModal";


function ActionScreen(props) {
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState({});
  const [editingTask, setEditingTask] = useState({});
  const [isDataLoaded, setDataLoaded] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  //Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); //Modal select create task/project
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const authState = useContext(AuthContext);

  //Theme
  const themeContext = useContext(ThemeContext)
  const theme = themeContext.theme;
  // const theme = useColorScheme();

  //Filters
  const filterContext = useContext(FilterContext)
  const [filters, setFilters] = useState({})
  console.log("PROPS: ", props.route, theme)

  //Offline
  const offlineContext = useContext(OfflineContext);
  const [syncMessage, setSyncMessage] = useState("");
  const [justSync, setJustSync] = useState(false);

  useEffect(() => {
    // console.log("OFFLINE STATUS", offlineContext.isOffline, justSync)
    const unsubscribe = props.navigation.addListener('focus', () => {
      if (!isDataLoaded) {
        console.log("OFFLINE STATUS", offlineContext.isOffline, justSync)
        fetchData()
      }
    });

    if (isDataLoaded && filterContext.isFiltered) {
      console.log("THIS IS THE FILTER CONTEXT", filterContext.context_id, filterContext.isFiltered, isDataLoaded)
      setFilters({ context_id: filterContext.context_id })
      setDataLoaded(false)
      fetchData()
    } else if (filters.context_id) {
      const auxFilters = filters; delete auxFilters.context_id
      setFilters(auxFilters)
      setDataLoaded(false)
      fetchData();
    }

    return unsubscribe;
  }, [authState, filterContext, props.navigation, justSync]);

  async function fetchData(fetchFilters) {

    let filter = { state: props.state, completed: false }
    if (props.state === 5) {
      filter = { project_id: props.project_id, completed: false }
    }

    if (filterContext.isFiltered) {
      filter.context_id = filterContext.context_id;
    }

    if (fetchFilters) {
      //provisional
      if (fetchFilters.project_id) {
        filter.project_id = fetchFilters.project_id;
      }
      if (fetchFilters.context_id) {
        filter.context_id = fetchFilters.context_id;
      }
      if (fetchFilters.tags) {
        filter.tags = fetchFilters.tags
      }
    }

    const tasksDB = await taskService.getTasks(filter);

    console.log("A OCURRIDO UN ERROR EN ACTIONSCREEEN", tasksDB.error)

    if (tasksDB.error) {
      if (tasksDB.error.status === 401) {
        return authState.signOut();
      } else if (tasksDB.error.status === 'timeout') {
        console.log("A UN TIMEOUT, OSEA NO TIENES CONEXION", tasksDB.error.status)
        //AQUI RECARGAMOS CON LO QUE HAY OFFLINE SI HAY
        if (tasks.length !== 0) {
          await storeDataInDevice(tasksDB)
        }
        offlineContext.setOfflineMode();
        let offLineTasks;
        if (props.state === 5) {
          //Es de proyecto
          // offLineTasks = await deviceStorage.getProjectTasks(props.project_id);
          console.log("A UN TIMEOUT, OSEA NO TIENES CONEXION Y ES UN PROYECTO", props.state, props.project_id, offLineTasks)
          offLineTasks = await getOfflineTasksProject(props.project_id);
        } else {
          // offLineTasks = await deviceStorage.getActionScreenData(props.state);
          offLineTasks = await getOfflineTasks();
          console.log("THIS ARE THE OFFLINE TASKSS", offLineTasks, offlineContext.catchedContent)
        }
        if (offLineTasks) {
          setDataInScreen(offLineTasks)
        }
      }
    } else {
      console.log("OFFLINE STATUS FETCH DATAS", offlineContext.isOffline, justSync)
      if (offlineContext.isOffline && !justSync) {
        setSyncMessage("Sincronizando")
        offlineContext.endOfflineMode();
        await synchronizeOfflineProcess(offlineContext.createTaskQueue);
        const tasksDB = await taskService.getTasks(filter);
        setDataInScreen(tasksDB)
      } else {
        console.log("Estas son las tareas que se devuelven", tasksDB)
        // synchronizeOfflineProcess();
        setDataInScreen(tasksDB)
        if (tasksDB.length > 0) {
          storeDataInDevice(tasksDB)
        }
      }
    }
  }

  const synchronizeOfflineProcess = async (tasks_list) => {
    console.log("WE ARE SYNCRONIZING THIS", tasks_list)
    offlineContext.synchrozineOffline(true);
    const numSyncTasks = await taskService.synchronizeTasks(tasks_list);

    await offlineContext.clearCatchedData();
    offlineContext.synchrozineOffline(false);

    setTimeout(() => {
      setSyncMessage(numSyncTasks + " tareas sincronizadas")
    }, 2500);

    setTimeout(() => {
      setSyncMessage("")
    }, 5000);
    setJustSync(true);
    
    return numSyncTasks;
  }


  const getOfflineTasksProject = async (project_id) => {
    let offLineTasks = offlineContext.catchedContent;
    return offLineTasks.projects && offLineTasks.projects[project_id] ? offLineTasks.projects[project_id].tasks : []
  }

  const getOfflineTasks = async () => {
    let offLineTasks = offlineContext.catchedContent;
    console.log("getOfflineTasks RESULTA", offlineContext.catchedContent)
    return offLineTasks[props.state] ? offLineTasks[props.state] : []
  }

  const setDataInScreen = (tasksDB) => {
    const seletedAux = {}
    tasksDB.forEach(async (task) => {
      seletedAux[task.task_id] = false;
    })

    seletedAux.total = 0;

    setTasks(tasksDB)
    setSelectedTasks(seletedAux)
    setDataLoaded(true)
  }

  const storeDataInDevice = async (tasks) => {
    if (props.state === 5) {
      //ES de proyecto
      // deviceStorage.storeProjectTasks(props.project_id, tasks);
      offlineContext.updateCatchedContext(props.state, tasks, props.project_id);
    } else {
      // deviceStorage.storeActionScreenData(props.state, tasks);
      offlineContext.updateCatchedContext(props.state, tasks);
    }
  }


  const reloadData = () => {
    setDataLoaded(false)
    fetchData()
  }

  const applyFilters = (filters) => {
    setDataLoaded(false)
    fetchData(filters)
  }

  const addTask = async (task) => {
    console.log("Nueva task", task)
    if (task.title.trim() !== "") {
      if (!offlineContext.isOffline) {
        const newTask = await taskService.createTask(task);
        if (newTask.task_id !== -1) {
          task.task_id = newTask.task_id;
          if (task.tags) {
            for (let tag of task.tags) {
              await taskService.addTag(task.task_id, tag)
            }
          }
          // setTasks([...tasks, task]);
          setIsCreateModalOpen(false);
          reloadData();
        } else {
          console.error("Error al agregar tarea a la base de datos");
        }
      } else {
        offlineContext.addTaskToQueue(task, offlineContext);
        setIsCreateModalOpen(false);
        //TODO ver que se hace con las tags
      }
    }
  };

  const addProject = async (project) => {
    console.log("Nuevo proyecto", project)
    if (project.title.trim() !== "") {
      const newProject = await projectService.createProject(project);
      console.log(newProject);
      if (newProject.project_id !== -1) {

        setIsCreateProjectOpen(false);
      } else {
        console.error("Error al agregar tarea a la base de datos");
      }
    }
  };

  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter((task) => task.task_id !== taskId);
    setTasks(updatedTasks);
    setSelectedTasks((prevSelectedTasks) =>
      prevSelectedTasks.filter((selectedTask) => selectedTask !== taskId)
    );
  };

  const deleteSelectedTask = () => {
    const updatedTasks = tasks.filter((task) => !selectedTasks.includes(task.task_id));
    setTasks(updatedTasks);
    setSelectedTasks([]);
  }

  const handleUpdateTasks = async (updatedTask) => {

    if (selectedTasks.total > 0) {
      await updateTaskList(updatedTask.state);
    } else {
      await updateTask(updatedTask);
    }
  }

  const updateTask = async (updatedTask) => {
    console.log("UPDATING TASK", updatedTask)
    if (updatedTask.tags) {
      for (let tag of updatedTask.tags) {
        await taskService.addTag(updatedTask.task_id, tag)
      }
    }
    const updatedTaskResult = await taskService.updateTask(updatedTask.task_id, updatedTask);
    console.log("ID: ", updatedTaskResult)
    if (updatedTaskResult !== -1) {
      // const updatedTasks = tasks.map((task) =>
      //   task.task_id === updatedTask.task_id ? { ...task, ...updatedTask } : task
      // );
      isEditModalOpen ? setIsEditModalOpen(false) : setIsMoveModalOpen(false);
      // setTasks(updatedTasks);
      reloadData();
    } else {
      console.error("Error al actualizar la tarea en la base de datos");
    }
  };

  const updateTaskList = async (state) => {

    const list_ids = Object.keys(selectedTasks).filter(key => selectedTasks[key] === true);

    const total = await taskService.moveTaskList(list_ids, state);

    setIsMoveModalOpen(false);
    reloadData();
  };

  const addFilter = async (filters) => {
    console.log("Añado los filtros", filters)
    if (filters) {
      setFilters(filters);
    } else {
      setFilters({})
    }
    applyFilters(filters);
  };

  const handleCompleteTasks = async () => {

    if (selectedTasks.total > 0) {
      await completeTaskList();
    } else {
      await completeTask();
    }
  }

  const completeTask = async () => {
    const updatedTask = { ...editingTask };
    const updatedTaskResult = await taskService.updateTask(updatedTask.task_id, { completed: true });

    if (updatedTaskResult !== -1) {
      const updatedTasks = tasks.map((task) =>
        task.task_id === updatedTask.task_id ? { ...task, ...updatedTask } : task
      );
      setIsCompleteModalOpen(false);
      setTasks(updatedTasks);
      reloadData();
    } else {
      console.error("Error al actualizar la tarea en la base de datos");
    }
  };

  const completeTaskList = async () => {

    const list_ids = Object.keys(selectedTasks).filter(key => selectedTasks[key] === true);

    const total = await taskService.completeTaskList(list_ids, true);

    setIsCompleteModalOpen(false);
    reloadData();
  };

  const showMovePopUp = (id) => {
    const taskToEdit = tasks.find(task => task.task_id === id);

    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setIsMoveModalOpen(true);
    } else {
      console.error(`No se encontró la tarea con ID: ${id}`);
    }
  }

  const showEditPopUp = async (id) => {
    const taskToEdit = tasks.find(task => task.task_id === id);

    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setIsEditModalOpen(true);
    } else {
      console.error(`No se encontró la tarea con ID: ${id}`);
    }
  }


  const showCompleteModal = (id) => {
    const taskToEdit = tasks.find(task => task.task_id === id);

    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setIsCompleteModalOpen(true);
    } else {
      console.error(`No se encontró la tarea con ID: ${id}`);
    }
  }

  const showAddTaskPopUp = () => {
    setIsCreateModalOpen(true);
  }

  const EmptyTaskListPanel = ({ icon }) => {
    return (
      <View style={styles.emptyListPanel}>
        <View style={styles.roundedPanel}>
          {icon}
          <Text style={styles.emptyListPanelText}>Parece que todavía no hay tareas</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 25 }}>

          {/* Sidebar icon */}
          {Dimensions.get('window').width <= 768 ? (<TouchableOpacity onPress={() => props.navigation.toggleDrawer()}>
            <Feather name="sidebar" size={28} color={Colors[theme].white} />
          </TouchableOpacity>) : <View></View>}

          {offlineContext.isOffline && <Ionicons name="cloud-offline" size={24} color={Colors[theme].white} />}
          {!offlineContext.isOffline && (offlineContext.isSynchronizing || syncMessage != "") &&
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="cloud-sync-outline" size={24} color={Colors[theme].white} />
              <Text style={{ color: Colors[theme].white, textAlignVertical: 'center', textAlign: 'center', marginHorizontal: 5, fontSize: 17 }}>
                {syncMessage}
              </Text>
              {syncMessage === 'Sincronizando' && <ActivityIndicator size={'small'} />}
            </View>
          }

          {/* Filter Context / tag */}
          <View style={{ minWidth: 50, justifyContent: 'flex-end' }}>
            <TouchableOpacity style={styles.area} onPress={() => setIsFilterModalOpen(true)}>
              {/* AQUI IRIA EL TEXTO DEL CONTEXTO FILTRADO */}
              {filterContext.isFiltered && <ContextBadge style={{ marginRight: 10 }} context_name={filterContext.context_name} handlePress={() => {
                // handleContextAction(null, context_name);
                filterContext.clearFilter();
                reloadData();
              }} />}
              <MaterialCommunityIcons name="filter-variant" size={28} color={Colors[theme].white} />
              {Object.keys(filters).length > 0 &&
                <Text style={{ color: Colors[theme].white }}>({Object.keys(filters).length})</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {props.children}

        {!isDataLoaded && <LoadingIndicator />}
        <NativeBaseProvider>
          {isDataLoaded && tasks.length === 0 ? <EmptyTaskListPanel icon={props.emptyIcon} /> :
            <TaskList
              tasks={tasks}
              navigation={props.navigation}
              route={props.route}
              showEditPopUp={showEditPopUp}
              showMovePopUp={showMovePopUp}
              showCompleteModal={showCompleteModal}
              selectedTasks={selectedTasks}
              setSelectedTasks={setSelectedTasks}
              setIsMoveModalOpen={setIsMoveModalOpen}
              setIsCompleteModalOpen={setIsCompleteModalOpen}
            />
          }

          <AddButton onPress={() => showAddTaskPopUp()} onLongPress={() => setIsModalVisible(true)} />

          {/* CREATE BUTTON MODAL SELECT TASK/PROJECT */}
          <AddTypeModal
            isModalVisible={isModalVisible}
            setIsModalVisible={setIsModalVisible}
            showAddTaskPopUp={showAddTaskPopUp}
            setIsCreateProjectOpen={setIsCreateProjectOpen}
          />

          {/* MOVE MODAL   */}
          <MoveTaskModal
            title="Move"
            // touch={hideEditPopUp}
            editingTask={editingTask}
            onAccept={handleUpdateTasks}
            isModalOpen={isMoveModalOpen}
            setIsModalOpen={setIsMoveModalOpen}
          />

          {/* EDIT MODAL   */}
          <CreateTaskModal
            title="Editar"
            // touch={hideEditPopUp}
            editingTask={editingTask}
            onAccept={updateTask}
            isModalOpen={isEditModalOpen}
            setIsModalOpen={setIsEditModalOpen}
          />

          {/* ADD TASK MODAL   */}
          <CreateTaskModal
            title="Añadir"
            // touch={hideEditPopUp}
            // editingTask={editingTask}
            onAccept={addTask}
            isModalOpen={isCreateModalOpen}
            setIsModalOpen={setIsCreateModalOpen}
            currentState={props.state === 0 ? 1 : props.state}
            project_id={props.project_id ? props.project_id : null}
          />

          <CompleteTaskModal
            title="Completar tarea"
            texto={"¿Desea completar esta tarea?"}
            onAccept={handleCompleteTasks}
            isModalOpen={isCompleteModalOpen}
            setIsModalOpen={setIsCompleteModalOpen}
          />
          {/* ADD PROJECT MODAL   */}
          <CreateProjectModal
            title="Añadir"
            // touch={hideEditPopUp}
            // editingTask={editingTask}
            onAccept={addProject}
            isModalOpen={isCreateProjectOpen}
            setIsModalOpen={setIsCreateProjectOpen}
          />

          {/* ADD FILTER MODAL */}
          <FilterModal
            onAccept={addFilter}
            isModalOpen={isFilterModalOpen}
            setIsModalOpen={setIsFilterModalOpen}
            fiterState={filters}
          />
          <SettingsModal isVisible={themeContext.isSettingsModalOpen} setVisible={themeContext.closeSettingsModal} mainNavigator={props} />
        </NativeBaseProvider>

      </View>
    </SafeAreaView>

  );
}

export default ActionScreen;