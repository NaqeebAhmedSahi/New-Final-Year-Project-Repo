import random
import json
import pickle
import numpy as np
import nltk
from nltk.stem import WordNetLemmatizer
# nltk.download('wordnet')
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import 
import tensorflow as tf
import keras
from keras.models import Sequential
from keras.layers import Dense, Activation, Dropout
from keras.optimizers import SGD

lemmatizer = WordNetLemmatizer()  # Corrected line
intents = json.loads(open("intense.json").read())

words = []
classes = []
documents = []
ignore_letters = ['?', ',', '.', '!']

for intent in intents["intents"]:
    for pattern in intent["pattern"]:
        wordList = nltk.word_tokenize(pattern)
        words.extend(wordList)  # Use extend instead of append
        documents.append((wordList, intent["tag"]))
        if intent['tag'] not in classes:
            classes.append(intent['tag'])
print(documents)
# Lemmatize th words
words = [lemmatizer.lemmatize(word) for word in words if word not in ignore_letters]
words = sorted(set(words))

classes = sorted(set(classes))

pickle.dump(words, open('words.pkl', 'wb'))
pickle.dump(classes, open('classes.pkl', 'wb'))

training = []
output_empty = [0] * len(classes)

for document in documents:
    bag = []
    word_patterns = document[0]
    word_patterns = [lemmatizer.lemmatize(word.lower()) for word in word_patterns]
    for word in words:
        bag.append(1) if word in word_patterns else bag.append(0)
        output_row = list(output_empty)
        output_row[classes.index(document[1])] = 1
        training.append([bag, output_row])

random.shuffle(training)
train_X = np.array([item[0] for item in training])  # Features (bag of words)
train_Y = np.array([item[1] for item in training])  # Labels (output row)

model = Sequential()
model.add(Dense(128, input_shape=(len(train_X[0]),), activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(64, activation='relu'))
model.add(Dropout(0.5))
model.add(Dense(32, activation='relu'))  # Additional layer
model.add(Dropout(0.5))
model.add(Dense(len(train_Y[0]), activation='softmax'))

# ... (your previous code)

# Replace 'lr' with 'learning_rate' and use the legacy optimizer
#sgd = tf.keras.optimizers.legacy.SGD(learning_rate=0.01, decay=1e-6, momentum=0.9, nesterov=True)
sgd = tf.keras.optimizers.legacy.SGD(learning_rate=0.01, decay=1e-6, momentum=0.9, nesterov=True)



model.compile(loss='categorical_crossentropy', optimizer=sgd, metrics=['accuracy'])

# ... (rest of your code)


hist = model.fit(np.array(train_X), np.array(train_Y),epochs=200,batch_size=5,verbose=1)


model.save('chatbot_model.keras', hist)
print("done")


#print(words)    
# Rest of your code...
