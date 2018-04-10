from flask import Blueprint, request, Response, jsonify
from allennlp.commands.elmo import ElmoEmbedder
from allennlp.data.tokenizers import WordTokenizer
import logging

logger = logging.getLogger()

expert_extension = Blueprint('expert_extension', __name__)

tokenizer = WordTokenizer()
elmoEmbedder = ElmoEmbedder()


@expert_extension.route('/elmo', methods=['POST'])
def fetch_elmo() -> Response:  # pylint: disable=unused-variable
    req = request.get_json(silent=True, force=True)
    sentences = req.get('sentences')
    result = []
    try:
        logger.info("Determining ELMo vectors for %s" % str(sentences)[:1000])
        tokenized = [tokenize(sentence) for sentence in sentences]
        embedded = elmoEmbedder.embed_batch(tokenized)
        for (sentence, tokens, embedding) in zip(sentences, tokenized,
                                                 embedded):
            result += [{
                "sentence": sentence,
                "tokens": tokens,
                "vectors": embedding.tolist(),
            }]
    except Exception as e:
        logger.error('Failed to determine ELMo vectors: ', e.message)
    return jsonify(result)


def tokenize(sentence):
    return [t.text for t in tokenizer.tokenize(sentence)]
