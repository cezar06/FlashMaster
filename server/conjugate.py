
import sys
import json
from mlconjug3 import Conjugator

def conjugate_verb(verb, tense, language='en'):
    conjugator = Conjugator(language)
    conjugated_verb = conjugator.conjugate(verb)
    return conjugated_verb.conjug_info[tense]

if __name__ == "__main__":
    verb = sys.argv[1]
    tense = sys.argv[2]
    language = sys.argv[3] if len(sys.argv) > 3 else 'en'
    conjugations = conjugate_verb(verb, tense, language)
    print(json.dumps(conjugations))
