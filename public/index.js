//Firestore database kode

//Imports etter firebase v.9
import { initializeApp } from 'firebase/app'
import { 
  getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc
 } from 'firebase/firestore'

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
  } from 'firebase/auth'

const firebaseConfig = { //Unike verdier for vår database
  apiKey: "AIzaSyD5aMpiqtIp69EhJ1z4Z61npB1j33ZW0CI",
  authDomain: "sjakktrener-faaf4.firebaseapp.com",
  databaseURL: "https://sjakktrener-faaf4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sjakktrener-faaf4",
  storageBucket: "sjakktrener-faaf4.appspot.com",
  messagingSenderId: "841442428087",
  appId: "1:841442428087:web:ea64013ca97f9d9b28b932",
  measurementId: "G-KJQRPJ9XZ3"
}
//Setter en kobling til db
initializeApp(firebaseConfig) 
localStorage.setItem('fen', 'start')

const db = getFirestore()
const brukerdb = collection(db, 'Brukere')
const auth = getAuth()

//Listener til registrer knappen => henter registrerte brukere
const registerForm = document.querySelector('#registerForm')
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault()
    registrerBruker()
  })
}

/*
Funksjon som henter text fra input felt og adder de til i db
Kaller derreter på funksjon som er lagd for å logge deg inn etter du har registrert deg
*/
async function registrerBruker() {
  const email = registerForm.email.value
  const password = registerForm.password.value
  const username = registerForm.username.value  

  await createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      addDoc(brukerdb, {
        Email: email,
        Name: username,
      })   
    })
    .catch(err => {
      alert(err.message)
    })
  await loggInnEtterRegistrering(email, password, username)
  registerForm.reset()
}
/*Logger deg inn med data hentet fra parameter som kommer fra inputfelt i registrerBruker()
Lagrer hvem som er logget inn i local Stroage så vi kan vise brukeren sin brukerinfo
*/
async function loggInnEtterRegistrering(email, password, username) {
  onAuthStateChanged(auth, () => { 
  signInWithEmailAndPassword(auth, email, password) 
    .then(() => {
        //Logger inn
        localStorage.setItem('username', username)
        localStorage.setItem('email', email)
    })
    .catch(err => {
      console.log(err.message)
    })
    settBrukerInfo()
  })
}
/*
Listener på logginn kanppen => Logger inn, men venter til man faktisk er innlogget før man går videre i koden
Sjekker alle emailene under Authtiaction i Firebase og hvis den er lik som de i databasen, som vi legger inn her, så 
setter man disse i local storage
*/
let username = localStorage.getItem('username')
let email = localStorage.getItem('email')
const loginForm = document.querySelector('#loginForm')
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    onAuthStateChanged(auth, (user) => { 
    e.preventDefault()
    const password = loginForm.password.value
    email = loginForm.email.value
  
    signInWithEmailAndPassword(auth, email, password)
      .then(cred => {
        if (cred.user) {
          getDocs(brukerdb)
            .then(snapshot => {
              snapshot.docs.forEach(doc => {
                if (doc.data().Email === email) {
                  username = doc.data().Name
                  localStorage.setItem('username', username)
                  localStorage.setItem('email', email)
                }
              })
            })
            .catch(err => {
              console.log(err.message)
            })
          loginForm.reset()
          settBrukerInfo()
        }
      })
      .catch(err => {
        alert(err.message)
      })
    })
  })
}
 
//Listener til logg av knappen => logger deg ut og fjener deg fra local storage
const loggOut = document.querySelector('#loggOut')
if (loggOut) {
  loggOut.addEventListener('click', () => {
    const user = auth.currentUser
    if(user){
    signOut(auth )
      .then(() => {
        localStorage.removeItem('username')
        localStorage.removeItem('email')
        localStorage.removeItem('docId')
        const statsBrukernavn = document.querySelector('#statsBrukernavn')
        const statsEmail = document.querySelector('#statsEmail')
        statsBrukernavn.innerHTML = ""
        statsEmail.innerHTML = ""
      })
      .catch(err => {
        console.log(err.message)
      })
    } else {
      alert('Ingen bruker logget inn')
    }
  })
}
//Listener på resetpassord knappen => sender deg en email om å resette pasordet
const resetEmail = document.querySelector('#forgotForm')
if (resetEmail) {
  resetEmail.addEventListener('submit', (e) => {
    sendPasswordResetEmail(auth, resetEmail.email.value)
    .then(() => {
      // Password reset sendt på email
    })
    .catch((err) => {
      alert(err.message)
    })
  })
}

//Listener på minProfil teskten => setter brukerinfo til overlay fra local storage
const bruker = document.querySelector('#bruker')
if (bruker) 
  bruker.addEventListener('click', () => settBrukerInfo())

//Funksjon som setter bruker info på "min profil" siden
function settBrukerInfo() {
  const statsBrukernavn = document.querySelector('#statsBrukernavn')
  const statsEmail = document.querySelector('#statsEmail')
  statsEmail.innerHTML = localStorage.getItem('email') 
  statsBrukernavn.innerHTML = localStorage.getItem('username')
}
//Listener på hentÅpninger knappen => henterBrukere() og viser slett åpninger knappen
const åpningerdb = collection(db, 'brukerÅpning')
const spilLagretÅpning = document.querySelector('#spilLagretÅpning')
if (spilLagretÅpning) {
  spilLagretÅpning.addEventListener('click', () => {
    hentBrukere()
    const slettÅpning = document.querySelector('#slettÅpning')
    slettÅpning.style.display = "block"
  }) 
}

const hentÅpning = document.querySelector('#hentÅpning')
/*Funksjon som henter alle brukerÅpningene og hvis brukernavnet er likt som den som er logget inn så 
legges åpningene til brukeren inn i åpninger array. Legger derreter disse inn i select med alle åpninger
*/
let åpninger  //Array over alle åpninger (navn, fen, id)
let brukere  //Array over alle brukere
async function hentBrukere() {
  let length = 0
  brukere = []
  åpninger = []
  await getDocs(åpningerdb)
    .then(snapshot => {
      brukere = []
      åpninger = []
      snapshot.docs.forEach(doc => {
        if(doc.data().Name == localStorage.getItem('username')) {
          brukere.push(({ ...doc.data(), id: doc.id }))
          åpninger.push( {"åpning" : doc.data().Åpning ,"fen": doc.data().FenString, "id": doc.id} )
          length++
        }
      })
    })
    .catch(err => {
      console.log(err.message)
  })
  console.log(brukere)
  hentÅpning.style.display = "block"
  hentÅpning.options.length = 0 //Resetter listen hver gang
  for (let i = 0; i < length; i++) 
    hentÅpning.add(new Option(brukere[i].Åpning, i)) 
}
 //Listener på hent åpning knappen => viser oversikt over alle trekk til den brukeren
if (hentÅpning) {
  hentÅpning.addEventListener('click', () => {
    hentValgtÅpning()
  })
}
//Looper igjennom alle åpningene og hvis den er lik den som er selected i selcet taggen så laster den den åpningen
async function hentValgtÅpning() {
  for (let i = 0; i < åpninger.length; i++) {
    if (åpninger[i].åpning == hentÅpning.options[hentÅpning.selectedIndex].text) {
      loadOpener('egenÅpning', åpninger[i].fen) 
      localStorage.setItem('fen', åpninger[i].fen)
    }
  }
}

//Listener på slett åpninger knappen => modalen kommer opp på skjermen og lager knapper og funksjoner for å lukke modalen igjen
const slettÅpning = document.querySelector('#slettÅpning')
if (slettÅpning) {
  slettÅpning.addEventListener('click', (e) => {
    //Modal setup
    const modal = document.getElementById("åpningerModal")
    modal.style.display = "block"
    const close = document.getElementsByClassName("close")[0]
    
    close.onclick = function() {
      modal.style.display = "none"
    }
    
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none"
      }
    }
    e.preventDefault()
    
    //Viser åpningene grafisk. Lager en ny row i table og legger inn navnet på åpningen og en slett knapp
    var index = 0
    const table  = document.getElementById('table')
    for (let i = 0; i < åpninger.length; i++) {
      index++
      var row = table.insertRow(index)
      var cell1 = row.insertCell(0)
      var cell2 = row.insertCell(1)
      cell1.innerHTML = åpninger[i].åpning
      cell2.innerHTML = "<button class=remove id="+'modal'+i+" onclick=fjern("+index+")>Slett</button>"
      
      //Listener på hver knapp som er lagd. Når klikket så slettes den i db
      const modal = document.querySelector('#modal'+i)
      modal.addEventListener('click', () => {
        const docRef = doc(db, 'brukerÅpning', åpninger[i].id)
        deleteDoc(docRef)
        .then(() => {
          
        })
      })
    }
  })
}
//Henter docId til brukeren i db og setter denne i local storage
async function hentDocId() {
  await getDocs(brukerdb)
    .then(snapshot => {
      snapshot.docs.forEach(doc => {
        if(doc.data().Name == localStorage.getItem('username')) 
          localStorage.setItem('docId', doc.id)
      })
    })
    .catch(err => {
      console.log(err.message)
  })
}
//Listener på Lagre "bytt brukernavn" knappen => laster alle HTML taggene og setter "lukke" funskoner på modal
const byttBrukernavn = document.querySelector('#byttBrukernavn')
if (byttBrukernavn) {
  byttBrukernavn.addEventListener('click', () => {
    const brukerModal = document.querySelector('#brukerModal')
    brukerModal.style.display = "block"
    const lukk = document.getElementsByClassName("lukk")[0]
    const avslutt = document.querySelector('#avslutt')
    const nyttBrukernavn = document.querySelector('#nyttBrukernavn')
    const brukerForm = document.querySelector('#brukerForm')
    
    lukk.onclick = function() {
      brukerModal.style.display = "none"  
    }
    avslutt.onclick = function() {
      brukerModal.style.display = "none"
    }
    
    window.onclick = function(event) {
      if (event.target == brukerModal) 
        brukerModal.style.display = "none"
    }
    /*
    Listener på "lagre nytt brukernavn" knappen => henter docId fra local storage og updater "Name" det dokumentet.
    Setter nye brukernavn i local storage. displayer dette på "min profil" siden og lukker brukermodal
    */
    nyttBrukernavn.addEventListener('click', (e) => {
      e.preventDefault()
      hentDocId()
      let docRef = doc(db, 'Brukere', localStorage.getItem('docId'))
      updateDoc(docRef, {
        Name: brukerForm.brukernavn.value
      })
      .then(() => {
        localStorage.setItem('username', brukerForm.brukernavn.value)
        settBrukerInfo()
        brukerModal.style.display = "none"
      })
    })
  })
}

/*
Listener på "lagre åpning" knappen => hvis inputfeltet ikke er tomt så hentes data derifra og fenStringen blir lagret
i local storage. Hvis brukernavnet ikke er blank så legges denne åpningen inn i brukerÅpninger
*/
const lagreButton = document.querySelector('#lagreÅpning')
if (lagreButton) {
  lagreButton.addEventListener('click', async () => {
    const inputÅpning = document.querySelector('#inputÅpning')
    const username = localStorage.getItem('username')

    if (inputÅpning.value.length !== 0) { // viss ikke tom
    const åpningNavn = inputÅpning.value
    const fenString = localStorage.getItem('egenÅpning')
      if (username.length != 0) {
        addDoc(åpningerdb, {
          FenString: fenString,
          Name: username,
          Åpning: åpningNavn,
        })
        .catch(error => {
          console.error('Error saving opening data:', error)
        }) 
        inputÅpning.value = ""
      }
    }
  })
}
