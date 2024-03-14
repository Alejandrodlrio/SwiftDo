import DatePicker from 'react-native-modern-datepicker';

export default function DatePickerFunction({ today, state, setState }) {

    return (
        <DatePicker
            onSelectedChange={(date) => {
                if (date !== state.date_name) {
                    if (state.date_name !== 'Fecha') setState({ ...state, showDatePicker: false })
                    setState({ ...state, date_name: date, state: "3" });
                }
            }}
            selected={state.date_name === 'Fecha' ? today.toISOString().split('T')[0] : state.date_name}
            current={state.date_name === 'Fecha' ? today.toISOString().split('T')[0] : state.date_name}
            minimumDate={today.toISOString().split('T')[0]}
            //Windows 
            mode='calendar'
            options={{
                backgroundColor: '#ffffff',
                textHeaderColor: '#666666',
                textDefaultColor: '#808080',
                selectedTextColor: 'white',
                mainColor: '#f39f18',
                textSecondaryColor: '#f39f18',
            }}
            configs={{
                dayNames: [
                    "Domingo",
                    "Lunes",
                    "Martes",
                    "Miércoles",
                    "Jueves",
                    "Viernes",
                    "Sábado",
                ],
                dayNamesShort: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
                monthNames: [
                    "Enero",
                    "Febrero",
                    "Marzo",
                    "Abril",
                    "Mayo",
                    "Junio",
                    "Julio",
                    "Agosto",
                    "Septiembre",
                    "Octubre",
                    "Noviembre",
                    "Diciembre",
                ],
                hour: 'Hora',
                minute: 'Minuto',
                timeSelect: 'Aceptar',
                timeClose: 'Cerrar',
            }}
        />
    )
}