importScripts('https://unpkg.com/mathjs@4.1.2/dist/math.min.js')

let layer = 0
let elmoData = []
let elmoDataIndex = {}
let id = null

function vectorEquality(u, v) {
  for (let i = 0; i < u.length; i++) {
    for (let j = 0; j < u[i].length; j++) {
      if (u[i][j] != v[i][j]) {
        return false
      }
    }
  }
  return true
}

function updateELMoDataIndex(token) {
  let tokenIndex = elmoDataIndex[token] || []
  let index = elmoData.length
  tokenIndex.push(index)
  elmoDataIndex[token] = tokenIndex
  return index
}

function addELMoData(data) {
  const existing = elmoDataIndex[data.token] || []
  for (let index in existing) {
    //need vector hash or approximate ball
    const existingData = elmoData[index]
    if (vectorEquality(existingData.vectors, data.vectors)) {
      console.log("not adding existing vector for ", data.token)
      return index
    }
  }
  let index = updateELMoDataIndex(data.token)
  elmoData.push(data)
  return index
}

function unit(vector) {
  return math.multiply(vector, 1 / math.hypot(vector))
}

function findAligned(delta, base, ignore) {
  delta = unit(delta)
  let best = { word: "", dot: -1 }
  for (let candidate of elmoData) {
    const word = candidate.token
    if (word == ignore) {
      continue;
    }
    const dot = math.multiply(delta, unit(math.subtract(candidate.vectors[layer], base)))
    if (dot > best.dot) {
      const sentence = candidate.sentence
      best = { word, dot, sentence }
    }
  }
  return best
}

addEventListener('message', function (e) {
  var data = e.data;
  const cmd = data.cmd
  const ticket = data.ticket
  const join = data.join
  let index = null
  switch (cmd) {
    case 'id':
      id = data.id
      break;
    case 'addELMoData':
      index = addELMoData(data)
      const token = data.token
      postMessage({ id, ticket, cmd, token, index });
      break;
    case 'findELMoData':
      index = data.index
      const foundData = elmoData[index]
      postMessage({ ...foundData, id, ticket, cmd });
      break;
    case 'findAligned':
      const best = findAligned(data.delta, data.base, data.ignore)
      postMessage({ id, cmd, join, best });
      break;
    case 'setLayer':
      layer = data.layer
      break;
    case 'stop':
      self.postMessage('WORKER STOPPED: ' + data.msg +
        '. (buttons will no longer work)');
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  }
}, false);
