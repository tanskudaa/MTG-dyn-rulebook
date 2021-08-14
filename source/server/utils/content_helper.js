// dependencies
const axios = require('axios')

/*
 * Functions
 */
// Fetch and parse plaintext files, return formatted JSON
const fetchPlainText = async (url) => {
  // TODO process.env
  const MAX_RESPONSE_SIZE = 1000000 // bytes

  try {
    /*
     * NOTE/TODO
     * Local file paths (file:// prefixed) return the SPA index page HTML contents. Go figure.
     * However, adding local file support would GREATLY expand potential real-world use cases.
     * I highly encourage returning to this assignment to add local support later.
     */
    const res = await axios({
      url: url, // TODO breaks without http:// prefix
      method: 'GET',
      maxContentLength: MAX_RESPONSE_SIZE, // Raises exception if exceeded
      headers: {
        'Accept': 'text/plain',
      }
    })

    // TODO error handling

    // return {data: res.data}
    return parseRules({data: res.data}) // TODO debug placeholder
  }
  catch (e) {
    // return {error: e.message}
    return parseRules({data: 'placehloder data', error: e.message}) // TODO debug placeholder
  }
}

// Parse and return the rules as formatted JSON
const parseRules = (plainDataObject) => {
  // Return error on invalid data or exception
  // TODO Re-evaluate error check necessity (move earlier?)
  if (plainDataObject.data === null ||
      plainDataObject.data === ''   ||
      plainDataObject.error           ) {
    // Paranoid code injection security, although there should be no way data ISN'T null at this point
    const { data, ...ret } = plainDataObject
    return ret
  }

  // Split on newlines
  const plainTextSplit = plainDataObject.data
    .replace(/(?:\\[rn]|[\r\n]+)+/g, '\n')  // CR+LF, CR and LF safe newline parse
    .split('\n')
    .filter(elem => elem.trim() !== '')     // Strip empty lines

  // Map onto array of rule numbers with indeces
  const indexingFunction = (elem, index) => {
    const temp = elem // TODO rename temp variable
      .split(' ')[0]
    const firstWord = (temp.charAt(temp.length - 1) === '.')
      ? temp.substring(0, temp.length - 1)
      : temp
    const firstDigits = firstWord
      .split('.')[0]

    if (!isNaN(firstDigits)) return { ruleNumber: firstWord, index: index }
  }

  const numberingIndexes = plainTextSplit
    .map(indexingFunction)
    .filter(elem => typeof elem !== 'undefined')

  /*
   * NOTE/TODO
   * It would be fairly trivial to add table of contents detection and dynamic table of contents
   * generation for files that lack one, which would add support for text files without table of
   * contents. In it's current state, lacking a table of contents breaks user-end navigation and
   * renders the whole app useless for these special case files.
   * 
   * However, adding this would be grossly out of the scope of the project
   * at the time of writing. Still, take into account earlier NOTE/TODO.
   */

  /*
   * NOTE Table of contents end detection is based on strictly increasing numbering, which means
   * user error in plain text document numbering will likely break front end navigation.
   */
  // Find end of table of contents/beginning of contents proper
  ruleNumberCompare = (a, b) => {
    const aDigits   = a.replace(/[^0-9.]/g, '')
    const bDigits   = b.replace(/[^0-9.]/g, '')
    const delta = parseFloat(aDigits) - parseFloat(bDigits)
    if (delta !== 0) {
      return delta
    }
    else {
      const aLetters  = a.replace(/[0-9.]/g,  '')
      const bLetters  = b.replace(/[0-9.]/g,  '')
      return aLetters.localeCompare(bLetters)
    }
  }

  const indexesSorted = [ ...numberingIndexes ]
  indexesSorted.sort((a, b) => ruleNumberCompare(a.ruleNumber, b.ruleNumber))

  // TODO Find contentBeginIndex

  // Pair table of content indeces to content indeces for later reference
  // TODO

  // return rulesSplit // TODO debug placeholder
  return indexesSorted
}

module.exports = {
  fetchPlainText,
  parseRules
}
