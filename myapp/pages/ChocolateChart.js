import {VictoryTheme, VictoryAxis, VictoryBar, VictoryChart} from 'victory-native';
import React from 'react';

class ChocolateChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            chocolatees: this.props.navigation.state.params
        };
        this.state.data = [];
        for (let i = 0; i < this.state.chocolatees.length; i++) {
            this.state.data.push({
                ids: this.state.chocolatees[i].id,
                name: this.state.chocolatees[i].body,
                value: this.state.chocolatees[i].date
            });
        }
    }

    render() {
        let chocolatees = this.state.data;
        // return (<PieChart data={this.state.data}/>)
        console.log(this.state.chocolatees);
        return (<View style={{
            flex: 1
        }}><VictoryChart theme={VictoryTheme.material} domainPadding={50}>
            <VictoryAxis
                // fixLabelOverlap={true}
                tickFormat={function (x, y) {
                    let sp = x.split(' ');
                    let res = '';
                    for (var i = 0; i < sp.length; i++) {
                        res += sp[i][0];
                    }
                    return res;
                }}
            />
            <VictoryAxis
                tickValues={[5, 10, 15, 20]}
                dependentAxis
            />
            <VictoryBar
                style={{flex: 1}}
                data={this.state.data}
                x="Description"
                y="Date"
            />
        </VictoryChart></View>)
    }
}
export default ChocolateChart
