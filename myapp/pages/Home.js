import React from 'react';
import {FlatList, View, AsyncStorage, Text, NetInfo} from 'react-native';
import {entryEndpoint} from './environment';
import ListItem from './ListItem';
import Toast from 'react-native-simple-toast';
import {Button} from 'react-native-elements';

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
                        buttonStyle={{
                            height: 45,
                            borderColor: "transparent",
                            borderRadius: 5,
                            margin: 0

                        }}
                        containerStyle={{marginTop: 20}}
                    />
                </View>
            ),
        };
    };

    constructor(props) {
        super(props);
        this.state = {
            entries: []
        }
        this.lastFetchedPage = -1;
        this.more = true;
        MAIN_SCREEN = this
    }

    async fetchEntriesByPage() {
        let that = this
        if (this.more === false) return;
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
                        entries: [...this.state.entries, ...responseJson.entries]
                    })
                } else {
                    console.log("status " + responseJson.status + " " + responseJson.outcome)
                }
            })
            .catch(function (err) {
                Toast.show('Failed to get items from the internet, trying local storage...', Toast.LONG);
                AsyncStorage.getItem("@ChocolateApp:chocolatees").then(function (res) {
                    that.setState({entries: JSON.parse(res)});
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
        this.props.navigation.setParams({ handleLogout: this.handleLogout });
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

    componentWillUnmount() {
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        console.log("FETCHHHHHHH UPDATEEEE")
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

    async syncronizeDataInserted() {
        console.log("inserted sync")

        let localNewData = []
        let unInsertedData = []

        AsyncStorage.getItem("@ChocolateApp:chocolateesInserted").then(function (res) {
            localNewData = JSON.parse(res)
            console.log("Success inserted sync get data!");
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage");
            console.log(err);
        });

        console.log("inserted " + localNewData.length)


        localNewData.map((chocolate) => {
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
                    userId: chocolate.userId
                }),
            }).catch(function (err) {
                unInsertedData.push(chocolate)
            });
        })
        AsyncStorage.removeItem("@ChocolateApp:chocolateesInserted");
        if (unInsertedData.length > 0) {
            AsyncStorage.setItem("@ChocolateApp:chocolateesInserted", JSON.stringify(unInsertedData)).catch(function (err) {
                console.log("Error on saving the chocolatees");
                console.log(err);
            })
        }

    }

    async syncronizeDataUpdated() {
        console.log("update sync")

        let localNewData = []
        let unUpdatingData = []
        AsyncStorage.getItem("@ChocolateApp:chocolateesUpdated").then(function (res) {
            localNewData = JSON.parse(res)
            console.log("Success updated sync get data!");
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage");
            console.log(err);
        });
        console.log("updated " + localNewData.length)

        localNewData.map((chocolate) => {
            console.log("update to server from local " + chocolate.body())
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
                    userId: chocolate.userId
                }),
            }).catch(function (err) {
                unUpdatingData.push(chocolate)
            });
        })
        AsyncStorage.removeItem("@ChocolateApp:chocolateesUpdated");
        if (unUpdatingData.length > 0) {
            AsyncStorage.setItem("@ChocolateApp:chocolateesUpdated", JSON.stringify(unUpdatingData)).catch(function (err) {
                console.log("Error on update the chocolatees");
                console.log(err);
            })
        }
    }

    async syncronizeDataDeleted() {
        console.log("delete sync")

        let localNewData = []
        let unDeletedData = []
        AsyncStorage.getItem("@ChocolateApp:chocolateesDeleted").then(function (res) {
            localNewData = JSON.parse(res)
            console.log("Success deleted sync get data!");
        }).catch(function (err) {
            console.log("Failed to get items from AsyncStorage");
            console.log(err);
        });

        console.log("deleted " + localNewData.length)

        localNewData.map((chocolate) => {
            console.log("update to server from local " + chocolate.body())
            fetch(`${entryEndpoint}/${chocolate.id}`, {
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

    }

    fetchWithTimeout(url, options = undefined, timeout = 4000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout)
            )
        ]);
    }

    syncronizeData() {
        console.log("syncronizeeee")
        this.syncronizeDataInserted()
        this.syncronizeDataUpdated()
        this.syncronizeDataDeleted()
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
                        onClick={(entry) => this.entryPressed(entry)}
                        element={item}/>
                }
                refreshing={false}
                onRefresh={() => this.refresh()}
            />
            <Button
                onPress={() => this.handleNewEntry()}
                title="New Chocolate"
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
        </View>);
    }

    handleLogout = () => {
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('userId');
        this.setState({token: null});
        const {navigate} = this.props.navigation;
        navigate('Login');
    };

}

export default Home;
