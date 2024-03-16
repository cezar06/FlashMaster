
import sys
from mlconjug3 import Conjugator

def get_all_conjugations(verb, language='en'):
    try:
       
        conjugator = Conjugator(language)

       
        conjugated_verb = conjugator.conjugate(verb)

        
        all_conjugations = conjugated_verb.conjug_info
        return all_conjugations
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    verb = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'en'

   
    conjugations = get_all_conjugations(verb, language)

    
    for mood, tenses in conjugations.items():
        print(f"\n{mood.capitalize()}:")
        for tense, data in tenses.items():
            print(f"  {tense.capitalize()}:")
            if isinstance(data, dict):
                for pronoun, conjugation in data.items():
                    print(f"    {pronoun}: {conjugation}")
            else:
                
                print(f"    {data}")
