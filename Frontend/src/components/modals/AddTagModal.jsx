import { Modal, View, TextInput, TouchableOpacity, Text, TouchableWithoutFeedback, ScrollView } from "react-native"
import styles from '../../screens/tasks/actionScreen.styles'
import { useEffect, useState } from "react";
import { contextModalStyles } from '../../styles/globalStyles'
import contextService from "../../services/context/contextService";
import Colors from "../../styles/colors";
import { FontAwesome, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import taskService from "../../services/task/taskService";
import tagService from "../../services/tag/tagService";



const AddTagModal = (props) => {

    const [tag, setTag] = useState([]);
    const [search, setSearch] = useState([]);
    const onNameChange = async (text) => {
        if (text != tag && text.length > 0) {
            let t = text + '%'
            let res = await tagService.searchTags({ search: t });
            setSearch(res);
        } else if (text.length === 0) {
            setSearch([]);
        }
        setTag(text)
        console.log(search);
    };
    const OutSide = ({ onCloseModal, isModalOpen }) => {
        const view = <View style={{ flex: 1, width: '100%' }} />;
        if (!isModalOpen) return view;
        return (
            <TouchableWithoutFeedback onPress={() => { onCloseModal() }} style={{ flex: 1, width: '100%' }}>
                {view}
            </TouchableWithoutFeedback>
        );
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={props.modalVisible}
            onRequestClose={() => props.setState({ ...props.state, showTagSelector: false })}
        >
            <View style={styles.stateModalContainer}>
                <OutSide isModalOpen={props.modalVisible} onCloseModal={props.onCloseModal} />
                <View style={styles.modalStyle}>

                    <TextInput
                        style={{ color: '#182E44', fontSize: 16, fontWeight: 'normal', width: '100%', marginBottom: 10 }}
                        placeholder="Nueva etiqueta"
                        value={tag}
                        onChangeText={onNameChange}
                        maxLength={15}
                        multiline={true}
                    />

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', alignItems: 'flex-end', marginBottom: 10 }}>
                        {search && Object.keys(search).map((key, index) => (
                            <View key={index} style={[styles.tags, { backgroundColor: search[key].colour }]}>
                                <TouchableOpacity onPress={() => props.handleSearchedTag(search[key].name, search[key].colour)}>
                                    <Text style={{ color: 'white', paddingBottom: 3 }}>{search[key].name}</Text>
                                </TouchableOpacity>
                            </View>

                        ))}

                    </View>

                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => props.handleSelectTag(tag)}>
                        <Text style={styles.acceptButtonText}>Aceptar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal >
    )
}


export default AddTagModal;