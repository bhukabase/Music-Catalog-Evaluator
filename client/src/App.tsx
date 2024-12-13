import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import Valuation from "./pages/Valuation";
import ReportViewer from "@/components/ReportViewer";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/valuation/new" component={Valuation} />
      <Route path="/valuation/:id/report" component={ReportViewer} />
      <Route>404 Page Not Found</Route>
    </Switch>
  );
}

export default App;
