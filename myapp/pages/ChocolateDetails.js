import React from 'react';
import _ from 'underscore';
import {Alert, StyleSheet, Text, View, AsyncStorage, Linking} from 'react-native';
import {entryEndpoint} from './environment';
import Toast from "react-native-simple-toast";
import {Button} from 'react-native-elements';
const fetch = require('react-native-cancelable-fetch');

class ChocolateDetails extends React.Component {
    static navigationOptions = {
        title: 'Chocolate Details',
    };

    constructor(props) {
        super(props);
        this.entry = this.props.navigation.state.params.entry;
    }

    render() {
        return (
            <View>
                <Text style={styles.txt}>Chocolate
                    from {new Date(this.entry.date).toDateString()}:</Text>
                <Text style={{margin: 10, fontWeight: "bold", fontSize: 20}}>{this.entry.body}</Text>
                <Button
                    onPress={() => this.handleEdit()}
                    title="Edit this chocolate"
                    titleStyle={styles.btnTitle}
                    buttonStyle={styles.btnStyle}
                    containerStyle={{marginTop: 20}}
                />
                <Button
                    onPress={() => this.handleDelete()}
                    title="Delete this chocolate"
                    titleStyle={styles.btnTitle}
                    buttonStyle={styles.btnDelete}
                    containerStyle={{marginTop: 20}}
                />
                <Button title="SEARCH ONLINE"
                        onPress={this.pressSearch.bind(this)}
                        titleStyle={styles.btnTitle}
                        buttonStyle={styles.btnStyle}
                        containerStyle={{marginTop: 20}}/>

                <Button title="Chart"
                        onPress={this.pressChart.bind(this)}
                        titleStyle={styles.btnTitle}
                        buttonStyle={styles.btnStyle}
                        containerStyle={{marginTop: 20}}/>
            </View>
        )
    }

    pressChart() {
        const {navigate} = this.props.navigation;
        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;
        navigate('ChocolateChart', MAIN_SCREEN.state.entries);
    }

    pressSearch() {
        Linking.openURL("https://www.google.ro/search?q=" + this.entry.body.replace(" ", "%20"));
    }

    handleEdit() {
        const {navigate} = this.props.navigation;
        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;
        navigate('NewChocolate', {entry: this.entry, MAIN_SCREEN: MAIN_SCREEN});
    }

    async handleDelete() {
        const {navigate} = this.props.navigation;
        let that = this
        this.fetchWithTimeout(`${entryEndpoint}/${this.entry.id}/${this.entry.userId}`, {
            timeout: 100,
            retries: 1,
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + await AsyncStorage.getItem('token')
            }
        }).then(
            (res) => {
                Alert.alert(
                    'Succes!',
                    'Entry deleted successfully!',
                    [
                        {
                            text: 'OK', onPress: () => {
                                this.deleteFromLocal()
                            }
                        },
                    ],
                    {cancelable: false}
                );
            },
            (err) => {
                that.saveLocalDelete(that.entry);
            }).catch(function (err) {
            that.saveLocalDelete(that.entry);

        });
    }

    saveLocalDelete(entry) {
        console.log("\ndelete id " + entry.id)
        Toast.show('Failed delete item, trying local...', Toast.LONG);

        AsyncStorage.getItem("@ChocolateApp:chocolateesDeleted").then(function (res) {

            let localDeleted = _.filter(JSON.parse(res), () => true);
            localDeleted.push(entry)

            console.log("Success deleted add size !" + localDeleted + " \n" + JSON.parse(res));
            AsyncStorage.removeItem("@ChocolateApp:chocolateesDeleted")

            console.log("insert deleted " + localDeleted.length)
            AsyncStorage.setItem("@ChocolateApp:chocolateesDeleted", JSON.stringify(localDeleted)).catch(function (err) {
                console.log("Failed to set items deleted");
            })

        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage add deleted");
            console.log(err);
        });

        this.deleteFromLocal()
    }

    deleteFromLocal() {
        AsyncStorage.removeItem("@ChocolateApp:chocolatees")

        const MAIN_SCREEN = this.props.navigation.state.params.MAIN_SCREEN;
        MAIN_SCREEN.state.entries = _.filter(MAIN_SCREEN.state.entries, (p) => p.id != this.entry.id || p.userId != this.entry.userId);
        MAIN_SCREEN.setState(MAIN_SCREEN.state);

        AsyncStorage.setItem("@ChocolateApp:chocolatees", JSON.stringify(MAIN_SCREEN.state.entries)).catch(function (err) {
            console.log(err);
        })
        const {navigate} = this.props.navigation;
        navigate('Home')
    }

    fetchWithTimeout(url, options = undefined, timeout = 3000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, abort) =>
                setTimeout(() => abort(new Error('timeout')), timeout)
            )
        ]);
    }
}

const styles = StyleSheet.create({
    btnTitle: {
        fontWeight: "700",
        color: "rgba(46, 49, 49, 1)"
    },
    btnStyle: {
        backgroundColor: "rgba(74, 50, 24, 1)",
        width: 305,
        height: 45,
        borderColor: "rgba(46, 49, 49, 1)",
        borderWidth: 1,
        borderRadius: 5,
        margin: 5,
        marginTop: 10
    },
    btnDelete: {
        backgroundColor: "rgba(150, 40, 27, 1)",
        width: 305,
        height: 45,
        borderColor: "rgba(46, 49, 49, 1)",
        borderWidth: 1,
        borderRadius: 5,
        margin: 5
    },
    txt:{margin: 10, fontWeight: "bold", fontSize: 20, color: "rgba(150, 40, 27, 1)"}

})

export default ChocolateDetails;
