// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { environment } from './src/env.js';
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: environment.apiKey,
    authDomain: environment.authDomain,
    databaseURL: environment.databaseURL,
    projectId: environment.projectId,
    storageBucket: environment.storageBucket,
    messagingSenderId: environment.messagingSenderId,
    appId: environment.appId,
    measurementId: environment.measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// Get a reference to the database service
const profileSelect = document.getElementById("profile");
const newProfileInput = document.getElementById("new-profile");
const exerciseSection = document.getElementById("exercise-section");

// Function to authenticate anonymously
function authenticate() {
    signInAnonymously(auth)
        .then(() => {
            console.log("Signed in anonymously");
            loadProfiles();
        })
        .catch((error) => {
            console.error("Error signing in anonymously:", error);
        });
}

// Function to load profiles
function loadProfiles() {
    const dbRef = ref(db);
    get(child(dbRef, `profiles/`)).then((snapshot) => {
        if (snapshot.exists()) {
            const profiles = snapshot.val();
            profileSelect.innerHTML = '';
            for (let profile in profiles) {
                const option = document.createElement('option');
                option.value = profile;
                option.textContent = profile;
                profileSelect.appendChild(option);
            }
            loadExerciseData();
        } else {
            console.log("No profiles available");
        }
    }).catch((error) => {
        console.error(error);
    });
}

function addProfile() {
    const profileName = newProfileInput.value.trim();
    if (profileName === '') {
        alert("Please enter a profile name");
        return;
    }

    // Create the profile with exercises
    const profileRef = ref(db, `profiles/${profileName}`);
    set(profileRef, {
        exercises: {}
    }).then(() => {
        // Load existing exercises
        const dbRef = ref(db, `exercises`);
        get(dbRef).then(snapshot => {
            const exercises = {};
            snapshot.forEach(exercise => {
                exercises[exercise.key] = 0; // Initialize with 0 reps
            });
            // Set the exercises for the new profile
            return set(ref(db, `profiles/${profileName}/exercises`), exercises);
        }).then(() => {
            // Reload profiles and exercise data
            loadProfiles();
            loadExerciseData();
            newProfileInput.value = '';
        }).catch(error => {
            console.error("Error adding profile:", error);
        });
    });
}

function loadExerciseData() {
    const selectedProfile = profileSelect.value;
    if (!selectedProfile) return;

    const dbRef = ref(db, `profiles/${selectedProfile}/exercises`);
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const exercises = snapshot.val();
            exerciseSection.innerHTML = '';
            for (let exercise in exercises) {
                const exerciseDiv = document.createElement('div');
                exerciseDiv.classList.add('form-group');
                const imageName = exercise.replace(/\s/g, '');
                var color = "red";
                var ripsLabel = "Remaining:";
                var descr = "";
                
                loadLogs(selectedProfile);
                var remaining = parseFloat(exercises[exercise].remaining);
                if(exercise == "running"){
                    remaining = remaining.toFixed(2);
                    descr = "Km";
                }
                if(remaining <= 0){
                    color = "green";
                    remaining = remaining *-1;
                    ripsLabel = "Extra:" ;
                }
                exerciseDiv.innerHTML = `
                    <div class="row">
                        <div class="column">
                            <img src="src/img/${imageName}.jpg" alt="" width=50% height=50%>
                        </div>
                        <div class="column">  
                                <label style="text-transform: capitalize;" for="${exercise}">${exercise}</label>  
                                <br/>
                                <label id="${exercise}Remaining" style=" font-size: 90%;"> ${ripsLabel} <span style="color:${color};">${remaining}</span>/${exercises[exercise].total}  ${descr}</label>
                            </div>
                        </div>
                        <div class="row">
                            <input type="number" id="${exercise}" class="form-control" value="0">
                            <button onclick="logExercise('${selectedProfile}', '${exercise}')" class="btn btn-dark btn-block">Log</button>
                        </div>
                `;
                exerciseSection.appendChild(exerciseDiv);
            }
        } else {
            console.log("No exercise data available");
        }
    }).catch((error) => {
        console.error(error);
    });
}

window.logExercise = function(profile, exercise) {
    const selectedProfileRef = ref(db, `profiles/${profile}/exercises/${exercise}`);
    get(selectedProfileRef).then((snapshot) => {
        if (snapshot.exists()) {
            const currentData = snapshot.val();
            const currentCount = currentData.remaining;
            /*console.log("snapshot.val()", currentData);
            console.log("currentCount", currentCount);*/

            const myElement = document.getElementById(exercise);
            const rips = parseFloat(myElement.value);
            
            const updatedCount = currentCount - rips; // Reduce by the value entered
            
            const updateData = {};
            updateData[`profiles/${profile}/exercises/${exercise}/remaining`] = updatedCount;

            update(ref(db), updateData).then(() => {
                console.log(`Exercise ${exercise} logged for profile ${profile}`);
                // Reload exercise data after updating
                loadExerciseData();
            }).catch((error) => {
                console.error("Error updating exercise count:", error);
            });

            const ddate = new Date().getTime();
            const logRef = ref(db, `profiles/${profile}/logs/${ddate}`);
            set(logRef, {
                date: ddate,
                exercise: exercise,
                total: currentData.total,
                currentCount: currentCount,
                reduced: rips,
                newCount: updatedCount
            }).then(() => {
                // Reload profiles and exercise data
                loadExerciseData();
            }).catch(error => {
                console.error("Error adding profile log:", error);
            });

        } else {
            console.log("Exercise data not found");
        }
    }).catch((error) => {
        console.error(error);
    });
}



// Function to update exercise data
function updateExercise(day, value) {
    const selectedProfile = profileSelect.value;
    if (!selectedProfile) return;

    update(ref(db, `profiles/${selectedProfile}/exercises`), {
        [day]: value
    }).catch((error) => {
        console.error(error);
    });
}


// Function to load exercises for a selected profile
function loadLogs(profile) {
    const dbRef = ref(db, `profiles/${profile}/logs`);
    //setActiveProfile(profile);
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const logs = snapshot.val();
            const logsList = document.getElementById("log-list");
            logsList.innerHTML = '';
            const logsListLabel = document.getElementById("log-list-label");
            logsListLabel.innerHTML = 'Logs for Selected Profile';
             // Convert logs object to array and sort by date in descending order (newest to oldest)
            const logsArray = Object.entries(logs).map(([key, log]) => ({ key, ...log }));
            logsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
            const div = document.createElement('table');
            div.classList.add('table' , 'table-striped');
            
                div.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Exercise</th>
                            <th scope="col">Old Count</th>
                            <th scope="col">Done</th>
                            <th scope="col">Remaining</th>
                        
                        </tr>
                    </thead>
                    <tbody id="log-table1-body">
                    </tbody>
                </table>
                `;
            const tbody = div.querySelector('#log-table1-body');
            for (let log of logsArray) {
                
              // console.log("log", log);
               //console.log("log..date", log.date);
                // Check if properties exist, if not, assign an empty string
                const date = log.date ? new Date(log.date).toLocaleString() : '';
                const exercise = log.exercise ? log.exercise : '';
                const currentCount = log.currentCount ? log.currentCount : '';
                const reduced = log.reduced ? log.reduced : '';
                var newCount = log.newCount ? log.newCount : '';
                var descr = "";
                if(exercise == "running"){
                    newCount = newCount.toFixed(2);
                    descr = "(Km)";
                }   
                if(exercise == "jump jack"){
                    descr = " (Minutes)";
                }

                var isExtra = '';
                var color = 'red';
                if(newCount <= 0){
                    if(newCount < 0){
                        isExtra = 'Extra: ';
                    }
                    newCount = newCount * -1;
                    color = 'green';
                }
               
                tbody.innerHTML +=`
                    
                        <tr>
                            <th scope="row">${date}</th>
                            <th scope="row">${exercise} ${descr}</th>
                            <th scope="row">${currentCount}</th>
                            <th scope="row">${reduced}</th>
                            <th scope="row"><span style="color:${color};">${isExtra}${newCount}</span></th>
                        
                        </tr>
                `;
            }
            
               
                div.innerHTML = div.innerHTML + `
                    </table>
                `;
                logsList.appendChild(div);
        } else {
            const logsList = document.getElementById("log-list");
            const logsListLabel = document.getElementById("log-list-label");
            logsList.innerHTML = '';
            logsListLabel.innerHTML = '';
            console.log("No logs available for this profile");
        }
    }).catch((error) => {
        console.error(error);
    });
}


// Attach functions to the window object to make them globally accessible
window.addProfile = addProfile;
window.loadExerciseData = loadExerciseData;

// Initial load of profiles after authentication
document.addEventListener("DOMContentLoaded", () => {
    authenticate();
});
