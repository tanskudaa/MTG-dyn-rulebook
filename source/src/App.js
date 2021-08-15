import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Switch, Route, Link, useHistory } from 'react-router-dom'
import axios from 'axios'
import './App.css'

/*
 * TODO React "Each child in a list should have a unique "key" prop."
 * TODO Accurate, exact way to determine if {rules} contains content
 */

const ruleHierarcyDepth = (ruleNumber) => {
  // NOTE/TODO Only allows main categories 1-9, but this isn't a bug, it's a feature (of the rulebook format)
  if (ruleNumber.length === 1) {
    return 0
  }
  else if (!ruleNumber.includes('.')) {
    return 1
  }
  else {
    return 2
  }
}

const Preamble = ({ rules }) => {
  if (!rules.preamble || !rules.preamble.length > 0) {
    return null
  }
  else {
    return (
      <div className="preamble">
        <h1>{rules.preamble[0]}</h1>
        {
          rules.preamble
            .filter((elem, index) => index > 0)
            .map(elem => <p>{elem}</p>)
        }
      </div>
    )
  }
}

const TableOfContents = ({ rules }) => {
  // TODO see top of file
  if (!rules.content || !Object.entries(rules.content).length > 0) {
    return null
  }
  else {
    const categories = Object.entries(rules.content)
      .filter(([ruleNumber]) => (
        ruleHierarcyDepth(ruleNumber) === 0
      ))

    const subcategories = Object.entries(rules.content)
      .filter(([ruleNumber]) => (
        ruleHierarcyDepth(ruleNumber) === 1
      ))
    return (
      <div className="toc">
        <h2>Table of Contents</h2>
        {
          categories.map(([ruleNumber, lines]) => (
            <ul>
              <li className="h3"><Link to={`/?s=${ruleNumber}`}>{ruleNumber}. {lines}</Link></li>
              <ul>
              {
                subcategories
                  .filter(([subRuleNumber]) => (
                    subRuleNumber.substring(0, 1) === ruleNumber
                  ))
                  .map(([subRuleNumber, subLines]) => (
                    <li>{subRuleNumber}. {subLines}</li>
                  ))
              }
              </ul>
            </ul>
          ))
        }
      </div>
    )
  }
}

const SectionContents = ({ rules, section }) => {
  if (!rules.content                            ||
      !section                                  ||
      !Object.entries(rules.content).length > 0 ) {
    return null
  }

  const title = Object.entries(rules.content)
    .filter(([ruleNumber]) => (
      ruleHierarcyDepth(ruleNumber) === 0 &&
      ruleNumber.substring(0, 1) === section.substring(0, 1)
    ))

  const subcategories = Object.entries(rules.content)
    .filter(([ruleNumber]) => (
      ruleHierarcyDepth(ruleNumber) === 1 &&
      ruleNumber.substring(0, 1) === section.substring(0, 1)
    ))

  const ruleLines = Object.entries(rules.content)
    .filter(([ruleNumber]) => (
      ruleHierarcyDepth(ruleNumber) > 1 &&
      ruleNumber.substring(0, 1) === section.substring(0, 1)
    ))

  return (
    <>
      {title.map(([ruleNumber, lines]) => (<h2>{ruleNumber}. {lines}</h2>))}
      {
        subcategories.map(([ruleNumber, lines]) => (
          <ul>
            <li className="h3"><b>{ruleNumber}.</b> {lines}</li>
            <ul>
              {
                ruleLines
                  .filter(([subRuleNumber]) => (
                    subRuleNumber.substring(0, 3) === ruleNumber
                  ))
                  .map(([subRuleNumber, subLines]) => (
                    <li className="p"><b>{subRuleNumber}.</b> {subLines}</li>
                  ))
              }
            </ul>
          </ul>
        ))
      }
    </>
  )
}

const SearchForm = ({ rules }) => {
  const [ results, setResults ] = useState([])
  const [ warning, setWarning ] = useState(null)

  useEffect(() => {
    const elem = document.getElementById('search-form')
    elem.classList.add('fade-in--activated')
  }, [])

  // TODO This handler function's readability makes me throw up
  const inputHandle = (event) => {
    if (event.target.value.length >= 3) {
      const res = Object.entries(rules.content)
        .filter(([ruleNumber, lines]) => (
            ruleHierarcyDepth(ruleNumber) > 1 &&
            lines.some(line => (
              line.toLowerCase().includes(event.target.value.toLowerCase())
            ))
          )
        )
      if (res.length > 0) {
        setWarning(null)
        setResults(res)
      }
      else {
        setWarning('No matches')
        setResults([])
      }
    }
    else if (event.target.value.length > 0) {
      setWarning('Please type 3 characters or more')
      setResults([])
    }
    else {
      setWarning(null)
      setResults([])
    }
  }

  return (
    <div
        className="block-container fade-in"
        id='search-form'
        style={{
          left: 0, top: '2em', 
          // TODO Horrible disgusting shameless workarounds
          'min-width': '450px', 'max-width': '450px',
        }}
    >
      <div className="block-container__content">
      <p className="h3">Search:</p>
      <input type="text" name="searchInput" onChange={inputHandle}></input>
      <p>{warning}</p>
        <ul>
          {
            results
              .map(([ruleNumber, lines]) => (
                <li><p><b>{ruleNumber}.</b> {lines}</p></li>
              ))
          }
        </ul>
      </div>
    </div>
  )
}

const Rules = ({ rules, section }) => {
  const [ blockPosition, setBlockPosition ] = useState({x: 4, y: '9em'})
  const divId = `content__section-${section}` // TODO double check

  useEffect(() => {
    const elem = document.getElementById(divId)
    const elemWidth = parseFloat(elem.offsetWidth)
    const pageWidth = parseFloat(document.body.offsetWidth)
    setBlockPosition({ ...blockPosition, x: (pageWidth-elemWidth)/2 + 200 })

    /*
      * TODO
      * Workaround to not bother with fade-out animation. The animation itself
      * works fine but SectionContents returns null before the animation has
      * any chance of finishing, which results in the Rules box violently changing
      * in appearance mid-animation.
      * 
      * I currently have no time to tinker on visuals any further, but would love
      * to fix this.
      */
    if (rules.content && section) {
      elem.style.transition = 'opacity 450ms'
      elem.classList.add('fade-in--activated')
    }
    else {
      elem.style.transition = 'no'
      elem.classList.remove('fade-in--activated')
    }
  }, [ rules, section ])

  return (
    <div
        className="block-container content__section fade-in"
        id={divId}
        style={{ left: blockPosition.x, top: blockPosition.y }}
    >
      <div className="block-container__content">
        <SectionContents
          rules={rules}
          section={section}
        />
      </div>
    </div>
  )
}

const Cover = ({ rules, url }) => {
  const [ blockPosition, setBlockPosition ] = useState({x: 0, y: '5em'})
  const divId = 'cover'

  useEffect(() => {
    const elem = document.getElementById(divId)
    const elemWidth = parseFloat(elem.offsetWidth)
    const pageWidth = parseFloat(document.body.offsetWidth)
    setBlockPosition({ ...blockPosition, x: (pageWidth-elemWidth)/2 })

    if (rules.content) {
      elem.classList.add('fade-in--activated')
    }
    else {
      elem.classList.remove('fade-in--activated')
    }
  }, [ rules ])

  return (
    <div
        className="block-container fade-in"
        id={divId}
        style={{ left: blockPosition.x, top: blockPosition.y }}
    >
      <div className="block-container__content">
        <Preamble rules={rules} />
        <TableOfContents rules={rules} />
      </div>
    </div>
  )
}

const App = (props) => {
  // TODO use models or whatever they were called
  const [ rules,    setRules    ] = useState({})
  const [ section,  setSection  ] = useState(null)

  const history = useHistory()
  const queryParams = () => new URLSearchParams(window.location.search)

  useEffect(() => {
    // TODO default url (MTG rules) always fetched, even if checking any other file
    axios.get('/api/read').then(res => setRules(res.data))
    setSection(queryParams().get('s'))
    window.history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    return history.listen(location => {
      setSection(queryParams().get('s'))
    })
  }, [history])

  return (
    <>
      <Switch>
        <Route exact path={'/'}>
          <Cover
            rules={rules}
            url={queryParams().get('url')} // TODO not like this
          />
          <SearchForm
            rules={rules}
          />
          <Rules
            rules={rules}
            section={section} />
        </Route>

        <Route path="/*">
          <p>404</p>
        </Route>
      </Switch>

      <footer>
        <div className="footer__content">
          <p>this page made by me!1 {'\u{1F604} \u{1F60A}'} (c) me twenty-whenever</p>
        </div>
      </footer>
    </>
  )
}

export default App
