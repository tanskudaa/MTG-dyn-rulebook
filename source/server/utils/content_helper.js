// dependencies
const axios = require('axios')

/*
 * TODO Check eqeqeq's
 */

/*
 * Functions
 */
// Fetch and parse plaintext files, return formatted JSON
const fetchPlainText = async (url) => {
  // TODO environment variablize
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

  /*
   *
   * TODO You NEED to refactor this whole mess. Good code but this function takes care of way
   * too many things. Separate clear single-purpose functions and construct a
   * fetchFormattedDocument(url) or so for index.js to call.
   * 
   */

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
    const lineSplit = elem.split(' ')[0]
    const firstWord = (lineSplit.charAt(lineSplit.length - 1) === '.')
      ? lineSplit.substring(0, lineSplit.length - 1)
      : lineSplit
    const firstDigits = firstWord
      .split('.')[0]

    if (!isNaN(firstDigits)) return { ruleNumber: firstWord, index: index }
  }

  const numberingIndexes = plainTextSplit
    .map(indexingFunction)
    .filter(elem => (typeof elem !== 'undefined' && elem.ruleNumber.length > 0))

  // Detect if table of contents present, find beginning and end of numbered rules
  ruleNumberCompare = (a, b) => {
    // TODO comment
    const aNumbers  = a.substring(0, 1) + '.' + a.substring(1, a.length - 1)
      .replace(/[^0-9.]/g, '')
      .split('.')
    const bNumbers  = b.substring(0, 1) + '.' + a.substring(1, b.length - 1)
      .replace(/[^0-9.]/g, '')
      .split('.')

    const significantDigits = Math.min(aNumbers.length, bNumbers.length)
    for (var i = 0; i < significantDigits; i++) {
      const delta = aNumbers[i] - bNumbers[i]
      if (delta !== 0) {
        return delta
      }
    }

    const aLetters  = a.replace(/[0-9.]/g,  '')
    const bLetters  = b.replace(/[0-9.]/g,  '')
    return aLetters.localeCompare(bLetters)
  }

  // First content line
  const firstNumbering = numberingIndexes[0] || { index: -1 }
  const firstNumberingRepeatedAt = plainTextSplit
    .indexOf(plainTextSplit[firstNumbering.index], firstNumbering.index + 1)
  const contentFirstIndex = (firstNumberingRepeatedAt === -1)
    ? firstNumbering.index
    : firstNumberingRepeatedAt

  // Last line of introduction (different from first content line IF table of contents present)
  const introductionLastIndex = (contentFirstIndex === firstNumberingRepeatedAt)
    ? firstNumbering.index - 2  // Has table of contents
                                // NOTE/TODO An extra line is stripped for presumed "Contents" header line, which COULD
                                // strip important introduction information (but doesn't for the Magic text file).
    : contentFirstIndex - 1     // No table of contents

  /*
   * NOTE Last line of numbered rules is detected by assuming strictly increasing numbering.
   * This means user error in writing the fetched plaintext rule file can cause sections of
   * text to be completely ignored.
   */
  // Last content line
  const { 0: contentLastIndex } = numberingIndexes
    .filter((elem, index) => (
      index <= numberingIndexes.length - 2      &&
      index >= contentFirstIndex                &&
      ruleNumberCompare(elem.ruleNumber, numberingIndexes[index + 1].ruleNumber) > 0
    ))
    .map(elem => elem.index)

  /*
   * Formatting for front end
   */

  /*
   * NOTE Now THIS bit is super interesting to me.
   *
   * The backend has a 1MB file size limit set, so I don't need to worry about sending everything
   * over to React as single JS object. However, anything larger than this, particularly orders of
   * magnitude larger, start benefitting or even demand dynamically sending only the information
   * the user is currently viewing.
   * 
   * That's out of the scope of this project at it's current state, but I'd love to look further
   * into this on an unrelated future project. This app simply formats everything into one
   * multi-thousand line JSON and sends it for the frontend to display as it sees fit. I can't
   * justify spending much more time on further optimizing this assignment, and I have a hard
   * time believing browser side performance gains would be even noticeable on modern hardware.
   * A quick Google search predicts load times around the 10 second mark, and RAM usage of ~50MB.
   */

  var result = {
    preamble: [],
    content:  {}
  }

  // Preamble
  if (introductionLastIndex > -1) {
    for (var i = 0; i <= introductionLastIndex; i++) {
      result.preamble.push(plainTextSplit[i])
    }
  }

  // Content
  /*
   * Whether or not the original plaintext file has a table of contents present, a new one
   * is dynamically created from actual contents to drop dependence on one being submitted.
   */
  const allRuleNumbers = numberingIndexes.map(elem => elem.ruleNumber)
  var lastRuleNumber = ''
  for (var i = contentFirstIndex; i <= contentLastIndex; i++) {
    const [ rest, ...lineSplit ] = plainTextSplit[i].split(' ')
    const line = lineSplit.join(' ') // TODO room for optimization

    const { 0: ruleNumber } = numberingIndexes
      .filter(elem => elem.index === i)
      .map(elem => elem.ruleNumber)

    if (
        // typeof ruleNumber !== 'undefined'                 && // TODO check necessity
        allRuleNumbers.includes(ruleNumber)               &&
        !Object.keys(result.content).includes(ruleNumber)
    ) {
      result.content[ruleNumber] = []
      result.content[ruleNumber].push(line)
      lastRuleNumber = ruleNumber
    }
    else {
      result.content[lastRuleNumber].push(plainTextSplit[i])
    }
  }

  return result
}

module.exports = {
  fetchPlainText,
  parseRules
}
