from flask import Blueprint, request, Response, jsonify
from allennlp.commands.elmo import ElmoEmbedder
from allennlp.data.tokenizers import WordTokenizer

expert_extension = Blueprint('expert_extension', __name__)

tokenizer = WordTokenizer()
elmoEmbedder = ElmoEmbedder()

@expert_extension.route('/elmo', methods=['POST'])
def fetch_elmo() -> Response:  # pylint: disable=unused-variable
    req = request.get_json(silent=True, force=True)
    sentences = req.get('sentences')
    result = []
    for sentence in sentences:
        sentenceTokens = [t.text for t in tokenizer.tokenize(sentence)]
        result += [{
            "sentence": sentence,
            "vectors": elmoEmbedder.embed_sentence(sentence.split()).tolist()
        }]
    return jsonify(result)

