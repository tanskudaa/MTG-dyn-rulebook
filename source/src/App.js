import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'
import axios from 'axios'

const Rules = ({ rules }) => {
  if (!rules.content) {
    return null
  }
  else {
    // Object.entries(rules.content)
    //   .filter((elem, index) => index < 10)
    //   .forEach(([key, value]) => console.log(key, value))

    return (
      Object.entries(rules.content)
        .map(([ruleNumber, lines]) => {
          // TODO React child unique key warning
          return <p>{ruleNumber} {lines}</p>
      })
    )
  }
}

const App = () => {
  // TODO use models or whatever they were called
  const [ rules, setRules ] = useState({})

  useEffect(() => {
    // TODO use models or whatever they were called
    axios.get('/api/read')
      .then(res => {
        console.log(res)
        setRules(res.data)
      })
  }, [])

  return (
    <Router>
      {/* <div>
        <Link to='/sec'>2nd page</Link>
      </div> */}

      <Switch>
        <Route exact path={['/', '/read']}>
          <Rules 
            rules={rules}
            // rulesSetter={setRules}
          />

        </Route>
        <Route path="/*">
          <p>404</p>
        </Route>
      </Switch>

      <div>this page made by me!1 {'\u{1F604} \u{1F60A}'} (c) me twenty-whenever</div>
    </Router>
  )
}

export default App
