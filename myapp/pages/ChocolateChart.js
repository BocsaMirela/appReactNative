import React from 'react';
import {Alert, StyleSheet, Text, View, AsyncStorage, Linking} from 'react-native';
import {
    LineChart
} from 'react-native-chart-kit'
import _ from "underscore";

const chartConfig = {
    backgroundGradientFrom: '#1E2923',
    backgroundGradientTo: '#08130D',
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`
}

class ChocolateChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            chocolatees: this.props.navigation.state.params
        };
        const months = ['Sun','Mon', 'Tus', 'Wed', 'Thu', 'Fry', 'Sat']
        let days = []
        for (let i = 0; i < this.state.chocolatees.length; i++) {
            days.push(new Date(this.state.chocolatees[i].date).getDay())
        }
        let sorted = [...new Set(days)]
        sorted = sorted.sort((n1, n2) => (n1 - n2));

        let labels=[]
        let dataEle=[]

        for (let i = 0; i < sorted.length; i++) {
            let nr = _.filter(days, (p) => p == sorted[i]).length
            labels.push(months[sorted[i]])
            dataEle.push(nr)
        }

        this.state.elements = {
            labels: labels,
            datasets: [{
                data: dataEle
            }]
        }
        console.log( " days ", days)
        console.log( " sorted  ", sorted)
        console.log( " data ele ", dataEle)

    }

    render() {
        console.log(this.state.chocolatees);
        return (<View style={{height: 200, padding: 20}}>
            <Text style={{margin: 10, fontWeight: "bold", fontSize: 20}}>Chart for week evidence</Text>
            <LineChart
                data={this.state.elements}
                width={320}
                height={350}
                chartConfig={chartConfig}
            />
        </View>)
    }
}

export default ChocolateChart

