from flask import Flask, request, jsonify
import random
import json
import pickle
import numpy as np
import nltk
from nltk.stem import WordNetLemmatizer
from autocorrect import Speller
import tensorflow as tf
from waitress import serve  # Production-ready WSGI server

# Initialize Flask app
app = Flask(__name__)

# Download NLTK data
nltk.download('punkt')
nltk.download('wordnet')

# Load preprocessing files and model
lemmatizer = WordNetLemmatizer()
spell = Speller(lang='en')
words = pickle.load(open('words.pkl', 'rb'))
classes = pickle.load(open('classes.pkl', 'rb'))
model = tf.keras.models.load_model('chatbot_model1.keras')

# Load intents data
with open("1.json", encoding='utf-8') as file:
    intents = json.load(file)

def clean_up_sentence(sentence):
    corrected_sentence = spell(sentence)
    sentence_words = nltk.word_tokenize(corrected_sentence)
    base_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return base_words

def bow(sentence, words):
    sentence_words = clean_up_sentence(sentence)
    bag = [0] * len(words)
    for s in sentence_words:
        for i, w in enumerate(words):
            if w == s:
                bag[i] = 1
    return np.array(bag)

def predict_intent(sentence):
    p = bow(sentence, words)
    res = model.predict(np.array([p]))[0]
    ERROR_THRESHOLD = 0.25
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({"intent": classes[r[0]], "probability": str(r[1])})
    return return_list

def get_response(intents_list, intents_json):
    tag = intents_list[0]['intent']
    list_of_intents = intents_json['intents']
    for i in list_of_intents:
        if i['tag'] == tag:
            result = random.choice(i['response'])
            break
    return result

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    prompt = data.get('prompt', '')
    
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    
    intents_list = predict_intent(prompt)
    response = get_response(intents_list, intents)
    
    return jsonify({
        'response': response,
        'detected_intent': intents_list[0]['intent'],
        'confidence': intents_list[0]['probability']
    })

if __name__ == '__main__':
    # For production use waitress (pip install waitress)
    serve(app, host="0.0.0.0", port=5001)
    
    # For development you can use:
    # app.run(host='0.0.0.0', port=5000)