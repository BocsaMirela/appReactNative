import React from 'react';
import {Alert, StyleSheet, Text, TextInput, View, AsyncStorage, Container} from 'react-native';
import {Button} from 'react-native-elements';
import {authEndpoint} from './environment';

class Login extends React.Component {
    static navigationOptions = {
        title: 'Login',
    };

    constructor(props) {
        super(props)
        this.state = {email: '', password: ''}
        AsyncStorage.getItem('token').then(token => {
            if (token) {
                // const expiry = jwt.decode(token).exp;
                // const now = new Date();
                // let isExpired=now.getTime() > expiry * 1000;
                let isExpired=false
                if (!isExpired) {
                    Object.assign(this.state, {token: token});
                    const {navigate} = this.props.navigation;
                    navigate('Home');
                } else {
                    Object.assign(this.state, {token: null});
                }
            } else Object.assign(this.state, {token: null});
        });
    }

    render() {
        return (
            <View>
                <Text style={{margin: 10}}>Email</Text>
                <TextInput style={{height: 40, borderColor: 'gray', margin: 10, borderWidth: 1}}
                           onChangeText={(email) => this.setState({email})} value={this.state.email}/>
                <Text style={{margin: 10}}>Password</Text>
                <TextInput type="password" secureTextEntry={true}
                           style={{margin: 10, height: 40, borderColor: 'gray', borderWidth: 1}}
                           onChangeText={(password) => this.setState({password})} value={this.state.password}/>
                <Button
                    onPress={() => this.handleLogin()}
                    title="Login"
                    titleStyle={{fontWeight: "700", color: "rgba(46, 49, 49, 1)"}}
                    buttonStyle={{
                        backgroundColor: "rgba(44, 130, 201, 1)",
                        width: 300,
                        height: 45,
                        borderColor: "transparent",
                        borderWidth: 0,
                        borderRadius: 5,
                        margin: 10

                    }}
                    containerStyle={{marginTop: 20}}
                />
            </View>
        )
    }

    // async handleLogout() {
    //     await AsyncStorage.removeItem('token');
    //     await AsyncStorage.removeItem('userId');
    //     await this.setState({token: null});
    //     const {navigate} = this.props.navigation;
    //     navigate('Login');
    // }

    handleHome() {
        const {navigate} = this.props.navigation;
        navigate('Home');
    }

    handleLogin() {
        const {navigate} = this.props.navigation;
        const credentials = {email: this.state.email, password: this.state.password};

        this.fetchWithTimeout(authEndpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...credentials
            }),
        }).then(res => res.json())
            .then(
                async (res) => {
                    if (res.token) {
                        let userId = res.id
                        let token = res.token;
                        await AsyncStorage.setItem('token', token);
                        await AsyncStorage.setItem('userId', userId.toString());
                        this.setState({token: token});
                        navigate('Home');
                    } else {
                        Alert.alert(
                            '',
                            'Invalid credentials',
                            [
                                {
                                    text: 'OK', onPress: () => {
                                    }
                                },
                            ],
                            {cancelable: false}
                        );
                    }
                },
                (err) =>{
                    Alert.alert(
                        '',
                        'Cannot connect to server',
                        [
                            {
                                text: 'OK', onPress: () => {
                                }
                            },
                        ]
                    )}).catch(function (err) {
                        Alert.alert(
                            '',
                            'Cannot connect to server',
                            [
                                {
                                    text: 'OK', onPress: () => {
                                    }
                                },
                            ],
                            {cancelable: false}
                        );
                    });
    }

    fetchWithTimeout(url, options = undefined, timeout = 4000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), timeout)
            )
        ]);
    }
}

const styles = StyleSheet.create({
    loading: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.5,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center'
    }
})

export default Login;
