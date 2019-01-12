import {createAppContainer, createStackNavigator} from 'react-navigation';
import NewChocolate from './NewChocolate';
import Home from './Home';
import Login from './Login';
import ChocolateDetails from './ChocolateDetails';
import ChocolateChart from './ChocolateChart';


const Stack = createStackNavigator({
  Login: {screen: Login},
  Home: {screen: Home},
  NewChocolate: {screen: NewChocolate},
  ChocolateDetails: {screen: ChocolateDetails},
  ChocolateChart: {screen: ChocolateChart}
});

const Application = createAppContainer(Stack);
export default Application;