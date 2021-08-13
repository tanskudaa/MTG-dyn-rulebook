import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'

const Rules = ({ rules }) => {
  return (
    <p>{`${rules}`}</p>
  )
}

const App = () => {
  const [ rules, setRules ] = useState('')

  useEffect(() => {
    setRules('bläb')
  }, [])

  return (
    <Router>
      {/* <div>
        <Link to='/sec'>2nd page</Link>
      </div> */}

      <Switch>
        <Route exact path='/'>
          <p>Home</p>
        </Route>
        {/* <Route path="/sec">
          <Rules rules={rules} />
        </Route> */}
        <Route path="/*">
          <p>404</p>
        </Route>
      </Switch>

      <div>this page made by me!1 {'\u{1F604} \u{1F60A}'} (c) me twenty-whenever</div>
    </Router>
  )
}

export default App
