import React from 'react';
import _ from 'underscore';
import {StyleSheet, Text, TextInput, View, Alert, AsyncStorage} from 'react-native';
import {entryEndpoint} from './environment';
import Toast from "react-native-simple-toast";
import {Button} from 'react-native-elements';


class NewChocolate extends React.Component {
    static navigationOptions = {
        title: 'Change Chocolate',
    };

    constructor(props) {
        super(props)
        this.entry = this.props.navigation.state.params.entry;
        this.state = {entry: this.entry && this.entry.body ? this.entry.body : ''};
    }

    render() {
        return (
            <View>
                <Text style={{margin: 10, fontWeight: "bold", fontSize: 20}}>Chocolate </Text>
                <TextInput
                    style={{borderColor: 'gray', margin: 10, borderWidth: 1}}
                    onChangeText={(entry) => this.setState({entry})}
                    value={this.state.entry}
                    multiline={true}
                    numberOfLines={4}
                    maxLength={256}
                />
                <Button
                    onPress={() => this.handleSubmit()}
                    title="Done"
                    titleStyle={{fontWeight: "700", color: "rgba(46, 49, 49, 1)"}}
                    buttonStyle={{
                        backgroundColor: "rgba(68, 108, 179, 1)",
                        height: 45,
                        borderColor: "rgba(46, 49, 49, 1)",
                        borderWidth: 1,
                        borderRadius: 5,
                        margin: 5

                    }}
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
            userID = id
        })
        if (entry === '') {
            Alert.alert("Empty field","Body for a chocolate cannot be empty")
        } else {
            if (!this.entry) {
                console.log("enstry body" + entry)
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
                        date: Date.now(),
                        userId: userID
                    }),
                }).then(res => res.json()).then(
                    async (res) => {
                        Alert.alert(
                            'Succes!',
                            'Entry updated successfully!',
                            [
                                {
                                    text: 'OK', onPress: () => {
                                        AsyncStorage.removeItem("@ChocolateApp:chocolatees")

                                        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;
                                        let chocolate = {
                                            id: MAIN_SCREEN.state.entries.length === 0 ? 1 : _.max(MAIN_SCREEN.state.entries, function (p) {
                                                return p.id
                                            }).id + 1,
                                            body: entry,
                                            date: Date.now(),
                                            userId: userID
                                        };
                                        MAIN_SCREEN.state.entries.push(chocolate)
                                        MAIN_SCREEN.setState(MAIN_SCREEN.state);

                                        AsyncStorage.setItem("@ChocolateApp:chocolatees", JSON.stringify(MAIN_SCREEN.state.entries)).catch(function (err) {
                                            console.log(err);
                                        })
                                        navigate('Home');
                                    }
                                },
                            ],
                            {cancelable: false}
                        );
                    },
                    (err) => {
                        that.saveLocal(entry, userID);
                    }).catch(function (err) {
                    that.saveLocal(entry, userID);
                });
            } else {
                console.log("update del " + this.entry.id)
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
                        date: Date.now(),
                        userId: userID
                    }),
                }).then(
                    (res) => {
                        Alert.alert(
                            'Succes!',
                            'Entry updated successfully!',
                            [
                                {
                                    text: 'OK', onPress: () => {
                                        AsyncStorage.removeItem("@ChocolateApp:chocolatees")

                                        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;
                                        MAIN_SCREEN.state.entries = MAIN_SCREEN.state.entries.slice();
                                        MAIN_SCREEN.state.entries = _.filter(MAIN_SCREEN.state.entries, (p) => p.id !== this.entry.id);
                                        console.log("possttsts " + this.entry.id)
                                        this.entry.body = entry
                                        this.entry.date = Date.now()
                                        MAIN_SCREEN.state.entries.push(this.entry)
                                        MAIN_SCREEN.setState(MAIN_SCREEN.state);

                                        AsyncStorage.setItem("@ChocolateApp:chocolatees", JSON.stringify(MAIN_SCREEN.state.entries)).catch(function (err) {
                                            console.log(err);
                                        })

                                        navigate('Home');
                                    }
                                },
                            ],
                            {cancelable: false}
                        );
                    },
                    (err) => {
                        that.saveLocalUpdate(chocolate, entry, userID);
                    }).catch(function (err) {
                    that.saveLocalUpdate(chocolate, entry, userID);

                });
            }
        }
    }

    saveLocal(entry, userID) {
        Toast.show('Failed add item, trying local...', Toast.LONG);
        console.log("inserted " + entry)

        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;

        let localInserted = []
        let localData = MAIN_SCREEN.state.entries

        AsyncStorage.getItem("@ChocolateApp:chocolateesInserted").then(function (res) {
            localInserted = JSON.parse(res)
            console.log("Success insert add size !" + localInserted.length);
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage add inserted");
            console.log(err);
        });

        let chocolate = {
            id: MAIN_SCREEN.state.entries.length === 0 ? 1 : _.max(MAIN_SCREEN.state.entries, function (p) {
                return p.id
            }).id + 1,
            body: entry,
            date: Date.now(),
            userId: userID
        };
        localData.push(chocolate)
        localInserted.push(chocolate)

        AsyncStorage.removeItem("@ChocolateApp:chocolateesInserted")
        AsyncStorage.removeItem("@ChocolateApp:chocolatees")

        console.log("insert inserted " + localInserted.length)

        AsyncStorage.setItem("@ChocolateApp:chocolateesInserted", JSON.stringify(localInserted)).catch(function (err) {
            console.log("Failed to set items insert");
        })

        AsyncStorage.setItem("@ChocolateApp:chocolatees", JSON.stringify(localData)).catch(function (err) {
            console.log(err);
        })

        const {navigate} = this.props.navigation;
        MAIN_SCREEN.setState(localData);
        navigate('Home');
    }

    saveLocalUpdate(entry, txt, userID) {
        console.log("entry update " + entry.id)
        Toast.show('Failed to update item, trying local...', Toast.LONG);

        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;

        let localUpdated = []
        let localData = MAIN_SCREEN.state.entries

        AsyncStorage.getItem("@ChocolateApp:chocolateesUpdated").then(function (res) {
            localUpdated = JSON.parse(res)
            console.log("Success update add size !" + localUpdated.length);
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage add updated");
            console.log(err);
        });

        localData = _.filter(localData, (p) => p.id !== entry.id || p.userId !== entry.userId);

        console.log("size " + localData.length)
        entry.body = txt
        entry.date = Date.now()
        localData.push(entry)
        localUpdated.push(entry)

        AsyncStorage.removeItem("@ChocolateApp:chocolateesUpdated")
        AsyncStorage.removeItem("@ChocolateApp:chocolatees")

        console.log("insert updated " + localUpdated.length)
        AsyncStorage.setItem("@ChocolateApp:chocolateesUpdated", JSON.stringify(localUpdated)).catch(function (err) {
            console.log("Failed to set items update");
        })

        AsyncStorage.setItem("@ChocolateApp:chocolatees", JSON.stringify(localData)).catch(function (err) {
            console.log(err);
        })

        const {navigate} = this.props.navigation;
        MAIN_SCREEN.setState(localData);
        navigate('Home');
    }

    fetchWithTimeout(url, options = undefined, timeout = 2500) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout)
            )
        ]);
    }
}

export default NewChocolate;
