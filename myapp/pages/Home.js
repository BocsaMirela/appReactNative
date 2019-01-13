import React from 'react';
import {FlatList, View, AsyncStorage, Text, NetInfo, StyleSheet, Image} from 'react-native';
import {entryEndpoint} from './environment';
// import ListItem from './ListItem';
import Toast from 'react-native-simple-toast';
import {Button, ListItem} from 'react-native-elements';
import _ from "underscore";

let MAIN_SCREEN;

class Home extends React.Component {
    static navigationOptions = ({navigation}) => {
        return {
            headerLeft: (<Text style={{margin: 10, fontSize: 30}}>Chocolates</Text>),
            headerRight: (
                <View>
                    <Button
                        onPress={navigation.getParam('handleLogout')}
                        title="Logout"
                        color="#000000"
                        buttonStyle={styles.logoutBtn}
                        containerStyle={{marginTop: 20}}
                    />
                </View>
            ),
        };
    };

    constructor(props) {
        super(props);
        this.state = {
            entries: [],
            isRefreshing: true
        }
        this.lastFetchedPage = -1;
        this.more = true;
        MAIN_SCREEN = this
    }

    render() {
        return (<View>
            <FlatList
                style={{height: '90%'}}
                keyExtractor={(item, index) => index.toString()}
                data={this.state.entries}
                // onEndReachedThreshold={0.5}
                // onEndReached={({distanceFromEnd}) => {
                //     this.fetchEntriesByPage();
                // }}
                renderItem={
                    ({item}) => <ListItem
                        title={
                            <View>
                                <Text style={styles.bodyItem}>{item.body.substring(0, 50) + '...'}</Text>
                            </View>}
                        subtitle={
                            <View>
                                <Text style={styles.dateItem}>{new Date(item.date).toDateString()}</Text>
                            </View>}
                        avatar={
                            <View>
                                <Image source={{uri: item.imagePath}} style={styles.imageStyle}/>
                            </View>}
                        containerStyle={{borderBottomWidth: 0, height: 110, width: '100%'}}
                        onPress={() => this.entryPressed(item)}
                        element={item}/>

                }
                refreshing={this.state.isRefreshing}
                onRefresh={() => this.refresh()}
            />
            <Button
                onPress={() => this.handleNewEntry()}
                title="New Chocolate"
                titleStyle={{fontWeight: "700", color: "rgba(46, 49, 49, 1)"}}
                buttonStyle={styles.buttonAdd}
                containerStyle={{marginTop: 20}}
            />

        </View>);
    }

    async fetchEntriesByPage() {
        let that = this
        if (this.more == false) return;
        console.log("FETCHHHHHHH DOOOOOOOOO FUNTION")
        this.fetchWithTimeout(`${entryEndpoint}?page=${this.lastFetchedPage + 1}`, {
            method: 'GET', headers: new Headers({
                'Authorization': 'Bearer ' + await AsyncStorage.getItem('token')
            })
        }).then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson);
                if (responseJson.entries) {
                    this.lastFetchedPage++;
                    this.more = responseJson.more;
                    this.setState({
                        entries: [...this.state.entries, ...responseJson.entries], isRefreshing:false
                    })
                } else {
                    console.log("status " + responseJson.status + " " + responseJson.outcome)
                }
            })
            .catch(function (err) {
                Toast.show('Failed to get items from the internet, trying local storage...', Toast.LONG);
                AsyncStorage.getItem("@ChocolateApp:chocolatees").then(function (res) {
                    that.setState({entries: JSON.parse(res),isRefreshing:false});
                    console.log("Success!");
                }).catch(function (err) {
                    console.log("Failed to get items from AsyncStorage chocolatees");
                    console.log(err);
                });
                this.more = false
            });
    }

    componentDidMount() {
        console.log("didMount")
        // AsyncStorage.removeItem("@ChocolateApp:chocolateesInserted");
        // AsyncStorage.removeItem("@ChocolateApp:chocolateesUpdated");
        // AsyncStorage.removeItem("@ChocolateApp:chocolateesDeleted");
        this.props.navigation.setParams({handleLogout: this.handleLogout});
        this.refresh();
    }

    refresh() {
        this.syncronizeData()
        this.more = true
        this.lastFetchedPage = -1;
        this.state.entries = []
        this.fetchEntriesByPage();
        if (this.state.more)
            this.fetchEntriesByPage();
    }

    handleNewEntry() {
        const {navigate} = this.props.navigation;
        this.props.navigation.setParams({MAIN_SCREEN: MAIN_SCREEN});
        navigate('NewChocolate', {MAIN_SCREEN: MAIN_SCREEN});
    }

    entryPressed(entry) {
        const {navigate} = this.props.navigation;
        navigate('ChocolateDetails', {entry: entry, MAIN_SCREEN: MAIN_SCREEN});
    }

    syncronizeDataInserted() {
        console.log("inserted sync")

        AsyncStorage.getItem("@ChocolateApp:chocolatees").then(function (res) {
            console.log(" inserted data ", res)
            res = _.filter(JSON.parse(res), (p) => p.wasInserted == 0);

            console.log("inserted " + res.length)

            res.map((chocolate) => {
                console.log("add to server from local " + chocolate.body)
                fetch(`${entryEndpoint}`, {
                    method: 'POST',
                    headers: new Headers({
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + AsyncStorage.getItem('token')
                    }),
                    body: JSON.stringify({
                        id: chocolate.id,
                        body: chocolate.body,
                        date: chocolate.date,
                        userId: chocolate.userId,
                        imagePath: chocolate.imagePath,
                        wasInserted: 1,
                        wasUpdated: chocolate.wasUpdated
                    }),
                }).catch(function (err) {

                });
            })
            console.log("Success!");
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage chocolatees");
            console.log(err);
        });

    }

    syncronizeDataUpdated() {
        console.log("update sync")

        let localNewData = []

        AsyncStorage.getItem("@ChocolateApp:chocolatees").then(function (res) {
            localNewData = _.filter(JSON.parse(res), (p) => p.wasUpdated == 0);

            console.log("updated " + localNewData.length)

            localNewData.map((chocolate) => {
                console.log("update to server from local " + chocolate.body)
                fetch(`${entryEndpoint}/${chocolate.id}`, {
                    method: 'PUT',
                    headers: new Headers({
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + AsyncStorage.getItem('token')
                    }),
                    body: JSON.stringify({
                        id: chocolate.id,
                        body: chocolate.body,
                        date: chocolate.date,
                        userId: chocolate.userId,
                        imagePath: chocolate.imagePath,
                        wasUpdated: 0,
                        wasInserted: chocolate.wasInserted
                    }),
                }).catch(function (err) {

                });
            })
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage update");
            console.log(err);
        });

    }

    syncronizeDataDeleted() {
        console.log("\ndelete sync")

        let localNewData = []
        let unDeletedData = []
        AsyncStorage.getItem("@ChocolateApp:chocolateesDeleted").then(function (res) {
            console.log("deleted " + JSON.parse(res))

            localNewData = _.filter(JSON.parse(res), () => true);
            console.log("Success deleted sync get data!");

            localNewData.map((chocolate) => {
                console.log("update to server from local " + chocolate.body)
                fetch(`${entryEndpoint}/${chocolate.id}/${chocolate.userId}`, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + AsyncStorage.getItem('token')
                    }
                }).catch(function (err) {
                    unDeletedData.push(chocolate)
                });
            })
            AsyncStorage.removeItem("@ChocolateApp:chocolateesDeleted");
            if (unDeletedData.length > 0) {
                AsyncStorage.setItem("@ChocolateApp:chocolateesDeleted", JSON.stringify(unDeletedData)).catch(function (err) {
                    console.log("Error on delete the chocolatees");
                    console.log(err);
                })
            }
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage deleted");
            console.log(err);
        });


    }

    fetchWithTimeout(url, options = undefined, timeout = 4000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, abort) =>
                setTimeout(() => abort(new Error('timeout')), timeout)
            )
        ]);
    }

    syncronizeData() {
        console.log("syncronizeeee")
        this.syncronizeDataInserted()
        this.syncronizeDataUpdated()
        this.syncronizeDataDeleted()
    }

    handleLogout = () => {
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('userId');
        this.setState({token: null});
        const {navigate} = this.props.navigation;
        navigate('Login');
    };


}

const styles = StyleSheet.create({
    buttonAdd: {
        backgroundColor: "rgba(74, 50, 24, 1)",
        height: 45,
        borderColor: "rgba(46, 49, 49, 1)",
        borderWidth: 1,
        borderRadius: 5,
        margin: 5
    },
    dateItem: {
        margin: 3,
        fontWeight: "bold",
        fontSize: 15,
        color: "rgba(150, 40, 27, 1)",
        marginLeft: 10
    },
    bodyItem: {
        marginLeft: 10,
        marginRight: 3,
        marginBottom: 3,
        marginTop: 0,
        padding: 1,
        fontWeight: "bold",
        fontSize: 16,
    },
    imageStyle: {
        margin: 3,
        width: 100,
        height: 80,
        backgroundColor: 'grey'
    },
    logoutBtn: {
        height: 45,
        borderColor: "transparent",
        borderRadius: 5,
        margin: 0

    }

});
export default Home;
