import React from 'react';
import _ from 'underscore';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Alert,
    AsyncStorage,
    Image,
    TouchableHighlight,
    TouchableOpacity
} from 'react-native';
import {entryEndpoint} from './environment';
import Toast from "react-native-simple-toast";
import {Button} from 'react-native-elements';
import {Permissions, ImagePicker} from 'expo';
import DatePicker from 'react-native-datepicker'


const defaultSource = '../images/choco.jpg'

const options = {
    title: 'Select Avatar',
    customButtons: [{name: 'fb', title: 'Choose Photo from Facebook'}],
    storageOptions: {
        skipBackup: true,
        path: 'images',
    },
};

class NewChocolate extends React.Component {
    static navigationOptions = {
        title: 'Change Chocolate',
    };

    constructor(props) {
        super(props)
        this.entry = this.props.navigation.state.params.entry;
        this.state =
            {
                entry: this.entry && this.entry.body ? this.entry.body : '',
                image: this.entry && this.entry.imagePath ? this.entry.imagePath : 'non',
                dateLoaded: this.entry && this.entry.date ? new Date(this.entry.date) : new Date()
            };
    }

    render() {
        return (
            <View>
                <Text style={styles.info}>Chocolate </Text>
                <TextInput
                    style={{borderColor: 'gray', margin: 10, borderWidth: 1}}
                    onChangeText={(entry) => this.setState({entry})}
                    value={this.state.entry}
                    multiline={true}
                    numberOfLines={4}
                    maxLength={256}
                />
                <TouchableOpacity onPress={() => this._handleButtonPressTakePhoto()}>
                    <Image
                        source={{uri: this.state.image}}
                        style={styles.imageStyle}
                        placeholder="take an image"
                    />
                </TouchableOpacity>
                <DatePicker
                    style={styles.datePicker}
                    mode="date"
                    date={this.state.dateLoaded}
                    placeholder="select date"
                    format="YYYY-MM-DD"
                    minDate="2018-05-01"
                    maxDate="2020-06-01"
                    confirmBtnText="Confirm"
                    cancelBtnText="Cancel"
                    customStyles={{
                        dateIcon: {
                            position: 'absolute',
                            left: 0,
                            top: 4,
                            marginLeft: 0
                        },
                        dateInput: {
                            marginLeft: 36
                        }
                        // ... You can check the source to find the other keys.
                    }}
                    onDateChange={(date) => {
                        this.setState({dateLoaded: date})
                    }}
                />
                <Button
                    onPress={this._handleButtonPressTakePhoto}
                    title="Load a photo"
                    titleStyle={styles.titleBtn}
                    buttonStyle={styles.btn}
                    containerStyle={{marginTop: 20}}
                />
                <Button
                    onPress={this._handleButtonPressMakePhoto}
                    title="Make a photo"
                    titleStyle={styles.titleBtn}
                    buttonStyle={styles.btn}
                    containerStyle={{marginTop: 20}}
                />
                <Button
                    onPress={() => this.handleSubmit()}
                    title="Done"
                    titleStyle={styles.titleBtn}
                    buttonStyle={styles.btn}
                    containerStyle={{marginTop: 20}}
                />
            </View>
        )
    }

    async handleSubmit() {
        const {navigate} = this.props.navigation;
        const entry = this.state.entry;
        let userID = 0
        let that = this
        let chocolate = this.entry
        AsyncStorage.getItem('userId').then(id => {
            userID = parseInt(id)
        })
        console.log(" dataaa ", (new Date(this.state.dateLoaded)).getTime())
        console.log(" dataaa 2222 ", new Date(this.state.dateLoaded))
        if (entry === '' || this.state.image == 'non') {
            Alert.alert("Empty field", "Body or image for a chocolate cannot be empty")
        } else {
            if (!this.entry) {
                this.fetchWithTimeout(`${entryEndpoint}`, {
                    timeout: 400,
                    method: 'POST',
                    headers: new Headers({
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + await AsyncStorage.getItem('token')
                    }),
                    body: JSON.stringify({
                        body: entry,
                        date: (new Date(this.state.dateLoaded)).getTime(),
                        userId: userID,
                        imagePath: this.state.image,
                        wasUpdated: 1,
                        wasInserted: 1
                    }),
                }).then(res => res.json()).then(
                    async (res) => {
                        Alert.alert(
                            'Succes!',
                            'Chocolate added successfully!',
                            [
                                {
                                    text: 'OK', onPress: () => {
                                        console.log(" entry recived from server ", res)
                                        this.saveLocal(res.id, entry, userID, 1)
                                    }
                                },
                            ],
                            {cancelable: false}
                        );
                    },
                    (err) => {
                        Toast.show('Failed add item, trying local...', Toast.LONG);
                        that.saveLocal(-1, entry, userID, 0);
                    }).catch(function (err) {
                    Toast.show('Failed add item, trying local...', Toast.LONG);
                    that.saveLocal(-1, entry, userID, 0);
                });
            } else {
                console.log("update del " + this.entry.id)
                console.log("update dataaaa " + new Date(this.state.dateLoaded))
                this.fetchWithTimeout(`${entryEndpoint}/${this.entry.id}/${this.entry.userId}`, {
                    method: 'PUT',
                    headers: new Headers({
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + await AsyncStorage.getItem('token')
                    }),
                    body: JSON.stringify({
                        id: this.entry.id,
                        body: entry,
                        date: (new Date(this.state.dateLoaded)).getTime(),
                        userId: userID,
                        imagePath: this.state.image,
                        wasUpdated: 1,
                        wasInserted: 1
                    }),
                }).then(
                    (res) => {
                        Alert.alert(
                            'Succes!',
                            'Chocolate updated successfully!',
                            [
                                {
                                    text: 'OK', onPress: () => {
                                        this.saveLocalUpdate(entry, 1)
                                    }
                                },
                            ],
                            {cancelable: false}
                        );
                    },
                    (err) => {
                        Toast.show('Failed update item, trying local...', Toast.LONG);
                        that.saveLocalUpdate(entry, 0);
                    }).catch(function (err) {
                    Toast.show('Failed update item, trying local...', Toast.LONG);
                    that.saveLocalUpdate(entry, 0);

                });
            }
        }
    }

    saveLocal(id, entry, userID, inserted) {
        AsyncStorage.removeItem("@ChocolateApp:chocolatees")
        console.log(" id  fisrt " + id)

        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;
        if (id == -1) {
            let idNew = MAIN_SCREEN.state.entries.length === 0 ? 1 : _.max(MAIN_SCREEN.state.entries, function (p) {
                return p.id
            }).id + 1
            id = parseInt(idNew)
        }

        let chocolate = {
            id: id,
            body: entry,
            date: (new Date(this.state.dateLoaded).getTime()),
            userId: parseInt(userID),
            imagePath: this.state.image,
            wasUpdated: 1,
            wasInserted: inserted
        };
        MAIN_SCREEN.state.entries.push(chocolate)
        MAIN_SCREEN.setState(MAIN_SCREEN.state);

        console.log(" entries ", MAIN_SCREEN.state.entries)

        AsyncStorage.setItem("@ChocolateApp:chocolatees", JSON.stringify(MAIN_SCREEN.state.entries)).catch(function (err) {
            console.log(err);
        })

        const {navigate} = this.props.navigation;
        navigate('Home');
    }

    saveLocalUpdate(entry, wasUpdated) {
        AsyncStorage.removeItem("@ChocolateApp:chocolatees")

        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;
        MAIN_SCREEN.state.entries = _.filter(MAIN_SCREEN.state.entries, (p) => p.id != this.entry.id || p.userId != this.entry.userId);

        this.entry.body = entry
        this.entry.date = (new Date(this.state.dateLoaded)).getTime()
        this.entry.wasUpdated = wasUpdated
        this.entry.imagePath = this.state.image
        MAIN_SCREEN.state.entries.push(this.entry)
        MAIN_SCREEN.setState(MAIN_SCREEN.state);

        AsyncStorage.setItem("@ChocolateApp:chocolatees", JSON.stringify(MAIN_SCREEN.state.entries)).catch(function (err) {
            console.log(err);
        })

        const {navigate} = this.props.navigation;
        navigate('Home');
    }

    fetchWithTimeout(url, options = undefined, timeout = 2500) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, abort) =>
                setTimeout(() => abort(new Error('timeout')), timeout)
            )
        ]);
    }

    _handleButtonPressTakePhoto = async () => {
        const {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
        if (status === 'granted') {
            console.log(" permission granted")
            let result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
            });
            console.log(result);

            if (!result.cancelled) {
                console.log(" image uri ", result.uri)
                this.setState({image: result.uri});
            }
        } else {
            throw new Error('Location permission not granted');
        }

    };

    _handleButtonPressMakePhoto = async () => {
        const {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
        if (status === 'granted') {
            console.log(" permission granted")
            let result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
            });
            console.log(result);

            if (!result.cancelled) {
                console.log(" image uri ", result.uri)
                this.setState({image: result.uri});
            }
        } else {
            throw new Error('Location permission not granted');
        }

    };
}

const styles = StyleSheet.create({
    buttonAdd: {
        backgroundColor: "rgba(68, 108, 179, 1)",
        height: 45,
        borderColor: "rgba(46, 49, 49, 1)",
        borderWidth: 1,
        borderRadius: 5,
        margin: 5
    },
    info: {
        margin: 10,
        fontWeight: "bold",
        fontSize: 20
    },
    titleBtn: {
        fontWeight: "700",
        color: "rgba(46, 49, 49, 1)"
    },
    btn: {
        backgroundColor: "rgba(74, 50, 24,1)",
        height: 45,
        borderColor: "rgba(46, 49, 49, 1)",
        borderWidth: 1,
        borderRadius: 5,
        margin: 5
    },
    imageStyle: {
        margin: 10,
        marginLeft: 80,
        padding: 10,
        width: 200,
        height: 200,
        backgroundColor: 'grey',
    },
    datePicker: {
        width: 300,
        marginTop: 5,
        marginLeft: 20,
        paddingLeft: 20,
        marginRight: 10,
        marginBottom: 5
    }

})
export default NewChocolate;
