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
  const { 0: firstNumbering } = numberingIndexes
  const firstNumberingRepeatedAt = plainTextSplit
    .indexOf(plainTextSplit[firstNumbering.index], firstNumbering.index + 1)
  const contentFirstIndex = (firstNumberingRepeatedAt === -1)
    ? firstNumbering.index
    : firstNumberingRepeatedAt

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

  // Pair table of content indeces to content indeces for later reference
  // TODO

  return plainTextSplit.filter((elem, index) => (contentFirstIndex <= index && index <= contentLastIndex))
}

module.exports = {
  fetchPlainText,
  parseRules
}
