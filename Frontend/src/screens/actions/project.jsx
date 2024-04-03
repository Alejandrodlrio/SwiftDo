import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import projectService from "../../services/project/projectService"
import ActionScreen from "../tasks/actionScreen";
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import React from "react";
import TaskStates from "../../utils/enums/taskStates";
import { actStyles } from "../../styles/globalStyles";
import CompleteTaskModal from "../../components/modals/CompleteTaskModal";
import CreateProjectModal from "../../components/modals/CreateProjectModal";
import Colors from "../../styles/colors";


function Project(props) {
    const [projectData, setData] = React.useState({ project: { project_id: props.route.params.project_id } })
    const [isCompleteModalVisible, setIsCompleteModalVisible] = React.useState(false);
    const [completeModalText, setCompleteModalText] = React.useState('');
    const [completeModalTitle, setCompleteModalTitle] = React.useState('');
    const [isDataLoaded, setDataLoaded] = React.useState(false);

    //Modal states
    const [editingProject, setEditingProject] = React.useState({});
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const theme = useColorScheme();
    const actStyle = actStyles(theme);
    React.useEffect(() => {
        // || projectData.project.project_id !== props.route.params.project_id
        // if (!isDataLoaded) {
        //     fetchData()
        //     //   setDataLoaded(true)
        // }
        const unsubscribe = props.navigation.addListener('focus', () => {
            console.log("SE EJECUTA FETCH DATA PROJECT", isDataLoaded, props.route.params)
            if (!isDataLoaded) {
                fetchData()
            }
        });

        return unsubscribe;
    }, [props.navigation]);

    async function fetchData() {
        const project = await projectService.showContent(props.route.params.project_id);
        setData(project);
        setDataLoaded(true);
        console.log("ID PROJECT, ", project);
    }
    const progressIcon = () => {
        let slice = Math.ceil(projectData.percentage / 12.5);
        if (isNaN(slice)) slice = 0
        return slice !== 0 ? `circle-slice-${slice}` : "circle-outline";
    }

    const handlePress = () => {
        // se puede completar el proyecto
        if (projectData.tasks.length === 0) {
            setCompleteModalTitle("Proyecto a punto de completarse")
            setCompleteModalText("¿Desea continuar?");
            // TODO completar proyecto
            setIsCompleteModalVisible(true);
            console.log(" no TAreas")
        }
        // Se debe avisar al usuario si quiere seguir con la accion de completar todas las tareas antes de completar el proyecto
        else {
            setCompleteModalTitle("Aún hay tareas sin completar")
            setCompleteModalText("Al completar este proyecto se completarán éstas tareas. ¿Desea continuar?");
            // TODO completar proyecto
            setIsCompleteModalVisible(true);
            console.log("Tareas")
        }
    }

    const reloadData = () => {
        setDataLoaded(false)
        fetchData()
    }

    const closeModal = () => {
        setIsCompleteModalVisible(false);
    }

    const showEditPopUp = (id) => {
        const projectToEdit = projectData.project;
        if (projectToEdit) {
            setEditingProject(projectToEdit);
            setIsEditModalOpen(true);
        } else {
            console.error(`No se encontró el proyecto con ID: ${id}`);
        }
    }
    const updateProject = async (updatedProject) => {
        console.log(updatedProject)
        const updatedProjectResult = await projectService.modifyProject(updatedProject.project_id, updatedProject);
        console.log("ID: ", updatedProjectResult)
        if (updatedProjectResult !== -1) {
            setIsEditModalOpen(false);
            // setData(updatedProject);
            reloadData();
        } else {
            console.error("Error al actualizar la tarea en la base de datos");
        }
    };

    const handleCompleteProject = async () => {
        const updatedProjectResult = await projectService.completeProject(projectData.project.project_id);

        if (updatedProjectResult !== -1) {
            closeModal()
            props.navigation.navigate('Inbox');
        } else {
            console.error("Error al completar el proyecto");
        }
    }

    return (
        <ActionScreen {...props} state={TaskStates.PROJECT} project_id={projectData.project.project_id}>
            {isDataLoaded &&
                <>
                    <View style={actStyle.action} >
                        <TouchableOpacity onPress={handlePress}>
                            <MaterialCommunityIcons name={progressIcon()} style={actStyle.iconAction} color={projectData.project.color} />
                        </TouchableOpacity>
                        <Text style={[actStyle.actionTitle, {color: Colors[theme].white}]}>{projectData.project.title}</Text>
                        <TouchableOpacity onPress={() => showEditPopUp(projectData.project.project_id)}>
                            <MaterialCommunityIcons name="circle-edit-outline" size={22} color="#ffa540" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[actStyle.description, {color: Colors[theme].white}]}> {projectData.project.description === null ? "Descripcion" : projectData.project.description} </Text>
                </>}
            <CompleteTaskModal
                title={completeModalTitle}
                texto={completeModalText}
                isModalOpen={isCompleteModalVisible}
                setIsModalOpen={closeModal}
                onAccept={handleCompleteProject}
            />
            {/* EDIT PROJECT MODAL   */}
            <CreateProjectModal
                title="Editar"
                // touch={hideEditPopUp}
                editingProject={editingProject}
                onAccept={updateProject}
                isModalOpen={isEditModalOpen}
                setIsModalOpen={setIsEditModalOpen}
            />
        </ActionScreen>

    )
}

export default Project;