
import { View, TouchableWithoutFeedback, Modal, useColorScheme } from "react-native";
import styles from '../../screens/tasks/actionScreen.styles'
import DatePicker from "../DatePicker";
import { useContext } from "react";
import ThemeContext from "../../services/theme/ThemeContext";
import Colors from "../../styles/colors";


const DatePickerModal = (props) => {
    //Theme
    const themeContext = useContext(ThemeContext);
    // const theme = useColorScheme();
    const theme = themeContext.theme;


    return (
        <Modal
            transparent={true}
            animationType={'fade'}
            visible={props.state.showDatePicker}
            onRequestClose={() => props.setState({ ...props.state, showDatePicker: false })}
            // {...props}
        >
            <View style={[styles.modalDatePickerContainer, {backgroundColor: theme === 'dark' ? 'rgba(54, 49, 53, 0.5)' : 'rgba(0, 0, 0, 0.5)'}]}>

                <TouchableWithoutFeedback onPress={() => props.setState({ ...props.state, showDatePicker: false })}>
                    <View style={styles.modalDatePickerBackground} />
                </TouchableWithoutFeedback>

                <View style={[styles.modalDatePickerContent, { zIndex: 2 }, {backgroundColor: Colors[theme].themeColor, borderWidth: theme === 'dark' ? 0.5 : 0, borderColor: theme === 'dark' ? 'white' : ''}]}>
                    <DatePicker
                        today={new Date()}
                        state={props.state}
                        setState={props.setState}
                        theme={theme}
                    />
                </View>
            </View>
        </Modal>
    )
}

export default DatePickerModal;