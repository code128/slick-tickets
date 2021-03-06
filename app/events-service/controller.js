// Config Variables
const notOnGoogleCloud = process.env.NOT_ON_GOOGLE_CLOUD

// External Dependencies
const admin = require('firebase-admin')

// Firebase Config
if (!notOnGoogleCloud) {
  admin.initializeApp({credential: admin.credential.applicationDefault()})
} else {
  const serviceAccount = require(`../../credentials/${process.env.SERVICE_ACCOUNT_FILE}`)
  admin.initializeApp({credential: admin.credential.cert(serviceAccount)})
}

let db = admin.firestore()
let eventsRef = db.collection('events')

// Utility Functions
function getOneEvent (slug, callback) {
  let query = eventsRef.where('slug', '==', slug).get()
    .then(snapshot => {
      if (snapshot.empty) {
        callback({ message: 'No event found.' }, null)
        return
      }

      let extractedEvents = []
      snapshot.forEach(event => {
        let thisEvent = event.data()
        thisEvent.id = event.id
        extractedEvents.push(thisEvent)
      })

      if (extractedEvents.length > 1) {
        callback({ message: 'Multiple events found.' }, null)
        console.log('Multiple events have the same slug.')
        return
      }

      const extractedEvent = extractedEvents[0]
      callback(null, extractedEvent)
    })
}

//TODO: 1 Uncomment the following lines by removing the start comment (/*)
//      and end comment (*/) tags. You'll find them on about line 50 and 65
//      You'll notice that this is a very slightly modified version of the 
//      code from our translate-text example. 

//Here's the start comment:
/*
//Load the Google Translation API
const {Translate} = require('@google-cloud/translate').v2;

// Creates a translation client
const translate = new Translate();

async function translateText(text, target) {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  const translation = await translate.translate(text, target);
  return translation;
}
//And here's the end comment
*/


// Controller Methods
exports.listEvents = function (req, res) {
  let allEventsExtracted = []

  let getEvents = eventsRef.get()
    .then(snapshot => {
      snapshot.forEach(event => {
        allEventsExtracted.push(event.data())
      })
      res.json({events: allEventsExtracted})
    })
    .catch(error => {
      console.log(error)
      res.json(error)
    })
}

exports.listMyEvents = function (req, res) {
  const userId = req.params.userId
  console.log('userId: ', userId)
  let allEventsExtracted = []

  let getEvents = eventsRef.where('attendees', 'array-contains', userId).get()
    .then(snapshot => {
      snapshot.forEach(event => {
        allEventsExtracted.push(event.data())
      })
      console.log('allEventsExtracted: ', allEventsExtracted)
      res.json({events: allEventsExtracted})
    })
    .catch(error => {
      console.log(error)
      res.json(error)
    })
}

exports.getEvent = function (req, res) {
  const slug = req.params.slug;
  
  //TODO: 2 Uncomment the below line using the same technique. Remove
  //        both /* and */ from around it. Here, you see the line that
  //        attempts to extract the query string "language"

  /*
  const language = req.query.language;
  */
  
  getOneEvent(slug, function (error, extractedEvent) {
    if (error) {
      res.json({ error: error });
    }
    //TODO: 3 Same approach, uncomment and then explore the below "else if" section. 
    //      This is the final TODO, so after you understand what it does, return to
    //      the standard exercise instruction steps. 
    /*
    else if(language){ //This block executed if "language" contains a value
        //Extract the name and description from the fetched event object
        var name = extractedEvent.name;
        var description = extractedEvent.description;
        
        //Dump them into an array
        var inputArray = [name, description];
        
        //Pass the array of two values to the translate function.
        //The function returns a Promise, which is "then" evaluated
        //once it has a value. 
        translateText(inputArray, language).then(([translationArray])=>{
          //Extract values from the returned translation array
          var transName = translationArray[0].toString();
          var transDescription = translationArray[1].toString();
          console.log(`translated Name: ${transName}, translated Description: ${transDescription}`);
          //Put the translated name and description back into the extractedEvent
          //object and pass it back out through the response object
          extractedEvent.name = transName;
          extractedEvent.description = transDescription;
          res.json(extractedEvent);
      });
    }
    */

    else {
      res.json(extractedEvent);
    }
  })
}

exports.createEvent = function (req, res) {
  let eventDetails = req.body
  eventDetails.attendees = []

  let addEventDoc = eventsRef.add(eventDetails)
    .then(event => {
      res.json({
        eventId: event.id,
        message: 'event added added successfully'
      })
    })
    .catch(error => {
      console.log(error)
      res.json(error)
    })
}

exports.deleteEvent = function (req, res) {
  const slug = req.params.slug
  getOneEvent(slug, function (error, extractedEvent) {
    if (error) {
      res.json( {error: error} )
    } else {
      let deleteEvent = eventsRef.doc(extractedEvent.id).delete()
      .then(() => {
        res.json({ message: `deleted event ${extractedEvent.id}`})
      })
      .catch(err => {
        res.json({ error: err })
      })
    }
  })
}

exports.updateEvent = function (req, res) {
  const slug = req.params.slug
  const updatedEvent = req.body

  getOneEvent(slug, function (error, extractedEvent) {
    if (error) {
      res.json( {error: error} )
    } else {
      const eventId = extractedEvent.id

      eventsRef.doc(eventId).update(updatedEvent)
        .then(event => {
          res.json({ message: `Event updated: ${event.id}`})
        })
        .catch(err => {
          res.json({ error: err })
        })
    }
  })
}

exports.patchEvent = function (req, res) {
  // Currently only registers a user for an event
  const slug = req.params.slug
  const userId = req.body.userId

  getOneEvent(slug, function (error, extractedEvent) {
    if (error) {
      res.json( {error: error} )
    } else {
      const eventId = extractedEvent.id
      const eventUpdate = {
        attendees: admin.firestore.FieldValue.arrayUnion(userId)
      }
      console.log('before update')
      eventsRef.doc(eventId).update(eventUpdate)
        .then(event => {
          console.log('eventId: ', eventId)
          res.json({ id: eventId})
        })
        .catch(err => {
          console.log(err)
          res.json({ error: err })
        })
    }
  })
}
