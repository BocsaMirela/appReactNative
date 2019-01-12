import React from 'react';
import {Text, View} from 'react-native';

class ListItem extends React.Component {
    render() {
        return (
            <View style={{margin: 10, borderWidth: 0.5, padding: 5}}>
                <Text
                    style={{margin: 3, fontWeight: "bold", fontSize:15, color:"rgba(150, 40, 27, 1)"}}
                    onPress={() => this.props.onClick(this.props.element)}>
                    {new Date(this.props.element.date).toDateString() + '\n'}
                </Text>
                <Text
                    style={{marginLeft: 3,marginRight: 3,marginBottom: 3,marginTop: 0, padding: 1,fontWeight: "bold", fontSize:16,}}
                    onPress={() => this.props.onClick(this.props.element)}>
                    { this.props.element.body.substring(0, 50) + '...'}
                </Text>
            </View>
        );
    }
}

export default ListItem;