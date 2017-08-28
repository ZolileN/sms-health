# SMS Health

Code for Civic Tech Leadership Program Team 42's Proof of Concept Chatbot

## Summary

PoC Chatbot for diagnosing common illnesses specifically targeted towards developing nations. It allows users to text a number which guides them through various questions to determine their symptoms and provide a diagnosis with treatment options. In severe cases, the chatbot will inform the user that they should seek medical attention immediately.

## Technical Information

Tools:
- NodeJS
- Heroku
- Redis
- Postgres
- Twilio (SMS API)
- ApiMedic (Medical API)

## Future Improvements

Improvements:
- Translation:
  - Add google translation API (in progress) so that users can interact with the API in their preferred language
- Make it stateless and scalable:
  - Remove node-cache server-side key/value storage in favor of another solution to link users to their records during the conversation

## Timeline

This side project was designed, built, tested, and deployed in 6 weeks.

## Demo

Demo: https://youtu.be/wvB8JWAWY0c
