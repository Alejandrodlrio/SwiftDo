import PopUpModal from "./PopUpModal"
import { View, TextInput, TouchableOpacity, Modal, Text, ScrollView } from "react-native"
import { useEffect, useState } from "react";
import styles from '../../screens/tasks/actionScreen.styles'
import { sideBar } from '../../styles/globalStyles'
import { FontAwesome5, Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import projectService from "../../services/project/projectService";

function MoveTaskModal(props) {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        async function fetchProjects() {
            const data = await projectService.showProjectsByUser();
            // console.log("PROJECTS", data)
            setProjects(data);
        }

        fetchProjects();
    }, [])

    const Title = () => {
        return (
            <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#182E44', fontSize: 23, fontWeight: '500', marginTop: 15 }}>
                    Mover a
                </Text>
            </View>
        )
    }

    const Separator = () => {
        return (
            <View style={sideBar.separator} />
        )
    }


    const Body = () => {
        const onAcceptFunction = (stateAux, project) => {
            const updatedTask = {};
            const today = new Date();

            Object.keys(props.editingTask).forEach(key => {
                if (props.editingTask[key] !== null) {
                    updatedTask[key] = props.editingTask[key];
                }
            });

            if(!project){
                updatedTask.state = stateAux;
                if (stateAux === "3") updatedTask.date_limit = today
            }else{
                updatedTask.project_id = stateAux;
            }
            console.log(updatedTask)
            props.onAccept(updatedTask);
        }


        const ProjectsSelection = () => {
            return (
                <View>
                    {projects.map(pro => {
                        return (
                            <TouchableOpacity key={pro.project_id} onPress={() => {
                                onAcceptFunction(pro.project_id, true);
                            }}>
                                <View style={styles.textContainer}>
                                    <MaterialCommunityIcons style={{ width: '15%' }} name="hexagon-slice-6" size={26} color={pro.color} />
                                    <Text style={{ fontSize: 17 }}>{pro.title}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            )
        }

        return (
            <View style={{ height: '100%', justifyContent: 'flex-end' }}>
                <View style={{ height: '100%', marginLeft: 20, marginRight: 8 }}>
                    <ScrollView>
                        <View>
                            <View style={styles.moveContainer}>
                                <View style={styles.moveStyle}>
                                    <TouchableOpacity onPress={() => {
                                        onAcceptFunction("2");
                                    }}>
                                        <View style={styles.textContainer}>
                                            <FontAwesome5 name="bolt" size={20} color={'#ffd700'} style={{ width: '15%' }} />
                                            <Text style={{ fontSize: 17 }}>Cuanto Antes</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        onAcceptFunction("3");
                                    }}>
                                        <View style={styles.textContainer}>
                                            <Ionicons name="calendar-outline" size={20} color={'#008080'} style={{ width: '15%' }} />
                                            <Text style={{ fontSize: 17 }}>Programada</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        onAcceptFunction("4");
                                    }}>
                                        <View style={styles.textContainer}>
                                            <Entypo name="archive" size={20} color="#d2b48c" style={{ width: '15%' }} />
                                            <Text style={{ fontSize: 17 }}>Archivadas</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        onAcceptFunction("1");
                                    }}>
                                        <View style={styles.textContainer}>
                                            <FontAwesome5 name="inbox" size={20} color="#f39f18" style={{ width: '15%' }} />
                                            <Text style={{ fontSize: 17 }}>Inbox</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <Separator />
                                    <ProjectsSelection />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        );
    }

    function onCloseModal() {
        props.setIsModalOpen(false);
    }

    return (
        <PopUpModal isModalOpen={props.isModalOpen} onCloseModal={onCloseModal}>
            <Title />
            <Body />
        </PopUpModal>
    )
}

export default MoveTaskModal;