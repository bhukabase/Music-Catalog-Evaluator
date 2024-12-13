import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import Valuation from "./pages/Valuation";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/valuation/:id" component={Valuation} />
      <Route>404 Page Not Found</Route>
    </Switch>
  );
}

export default App;
