// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, remove } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
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

let activeProfile = null; // Global variable to store the active profile

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
    const dbRef = ref(db, 'profiles/');
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const profiles = snapshot.val();
            const profilesList = document.getElementById("profiles-list");
            profilesList.innerHTML = '';
            for (let profile in profiles) {
                const div = document.createElement('div');
                div.classList.add('list-group-item');
                div.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <span onclick="setActiveProfile('${profile}')">${profile}</span>
                        <button onclick="deleteProfile('${profile}')" class="btn btn-danger btn-sm">Delete</button>
                    </div>
                    <div class="ml-4 mt-2">
                        <button onclick="loadExercises('${profile}')" class="btn btn-secondary btn-sm">Manage Exercises</button>
                    </div>
                `;
                profilesList.appendChild(div);
            }
        } else {
            console.log("No profiles available");
        }
    }).catch((error) => {
        console.error(error);
    });
}

// Function to set the active profile
function setActiveProfile(profile) {
    activeProfile = profile;
    //setActiveProfile(profile);
    console.log("profile" , profile);
    document.querySelectorAll('#profiles-list .list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`#profiles-list .list-group-item span[onclick="setActiveProfile('${profile}')"]`).parentNode.parentNode.classList.add('active');
    //loadExercises(profile);
}

// Function to add a new profile
function addProfile() {
    const profileName = document.getElementById("new-profile-name").value.trim();
    if (profileName === '') {
        alert("Please enter a profile name");
        return;
    }
    console.log("profileNamee" , profileName);
   /* const profileRef = ref(db, `profiles/${profileName}`);
    set(profileRef, {
        exercises: {}
    }).then(() => {
        loadProfiles();
        document.getElementById("new-profile-name").value = '';
    }).catch((error) => {
        console.error("Error adding profile:", error);
    });*/
     // Create the profile with exercises
     const profileRef = ref(db, `profiles/${profileName}`);
     set(profileRef, {
        
         exercises: {}
     }).then(() => {
         // Load existing exercises
         console.log("profileNamee in then" , profileName);
         const dbRef = ref(db, `exercises`);
         get(dbRef).then(snapshot => {
             const exercises = {};
             snapshot.forEach(exercise => {
                const newExerciseRips = {
                    remaining: exercise.val(),
                    total: exercise.val()
                };
                 exercises[exercise.key] = newExerciseRips; 
             });
             // Set the exercises for the new profile
             //loadProfiles();
             set(ref(db, `profiles/${profileName}/exercises`), exercises);
             
             
             
         }).then(() => {
            console.log("profileNamee in then then " , profileName);
             // Reload profiles and exercise data
             loadProfiles();
             //loadExerciseData();
             document.getElementById("new-profile-name").value = '';
         }).catch(error => {
             console.error("Error adding profile:", error);
         });
     });
}

// Function to delete a profile
function deleteProfile(profile) {
    const profileRef = ref(db, `profiles/${profile}`);
    remove(profileRef).then(() => {
        loadProfiles();
    }).catch((error) => {
        console.error("Error deleting profile:", error);
    });
}

// Function to load exercises for a selected profile
function loadExercises(profile) {
    const dbRef = ref(db, `profiles/${profile}/exercises`);
    setActiveProfile(profile);
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const exercises = snapshot.val();
            const exercisesList = document.getElementById("exercises-list");
            exercisesList.innerHTML ="";
            const div = document.createElement('table');
            div.classList.add('table');    
            div.classList.add('table-hover');
            //div.classList.add('table-bordered');
                div.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Exercise Name</th>
                            <th scope="col">Remaining</th>
                            <th scope="col">Total</th>
                            <th scope="col">Action</th>
                        
                        </tr>
                    </thead> 
                `;
            for (let exercise in exercises) {
                
                var remaining = exercises[exercise].remaining;
                var descr = "";
                if(exercise == "jump jack"){
                    descr = " (Minutes)";
                }
                if(exercise == "running"){
                    remaining = remaining.toFixed(2);
                    descr = "(Km)";
                }
                div.innerHTML = div.innerHTML+`
                
                <tr>
                        <td scope="row">${exercise}</td>
                        <td scope="row"><input type="number" value="${remaining}" class="form-control btn-block" onchange="updateExercise('${profile}', '${exercise}', this.value)"></td>
                        <td scope="row"><input type="number" value="${exercises[exercise].total}" class="form-control btn-block" onchange="updateExerciseTotal('${profile}', '${exercise}', this.value)"></td>
                        <td scope="row"><button onclick="deleteExercise('${profile}', '${exercise}')" class="btn btn-danger btn-sm">Delete</button></td>
                
                </tr>
                
            `;
                
            }
            div.innerHTML = div.innerHTML+`</table>`;
            exercisesList.appendChild(div);
            exercisesList.innerHTML = exercisesList.innerHTML +  `
            <div class="d-flex justify-content-between align-items-center">
                <button onclick="resetExercises('${profile}')" class="btn btn-danger btn-block">Reset</button>
            </div>
        `;
            loadLogs(activeProfile);
            loadResetLogs(activeProfile);
        } else {
            console.log("No exercises available for this profile");
        }
        
    }).catch((error) => {
        console.error(error);
    });
}

// Function to add a new exercise to a profile
function addExercise() {
    if (!activeProfile) {
        alert("Please select a profile to add exercise to");
        return;
    }
    const exerciseName = document.getElementById("new-exercise-name").value.trim();
    const totalReps = parseInt(document.getElementById("new-exercise-total").value);

    if (!exerciseName || totalReps <= 0) {
        alert("Please enter a valid exercise name and total reps");
        return;
    }
    const newExerciseRips = {
        remaining: totalReps,
        total: totalReps
    };
    const exerciseRef = ref(db, `profiles/${activeProfile}/exercises/${exerciseName}`);
    set(exerciseRef, newExerciseRips).then(() => {
        loadExercises(activeProfile);
        loadLogs(activeProfile);
        loadResetLogs(activeProfile);
        document.getElementById("new-exercise-name").value = '';
        document.getElementById("new-exercise-total").value = '';
    }).catch((error) => {
        console.error("Error adding exercise:", error);
    });
}

// Function to update an exercise's total reps

// Function to update an exercise's total reps
function updateExercise(profile, exercise, total) {
    const exerciseRef = ref(db, `profiles/${profile}/exercises/${exercise}/remaining`);
    set(exerciseRef, parseInt(total)).catch((error) => {
        console.error("Error updating exercise:", error);
    });
    loadExercises(profile);
}

// Function to update an exercise's total reps
function updateExerciseTotal(profile, exercise, total) {
    const exerciseRef = ref(db, `profiles/${profile}/exercises/${exercise}/total`);
    console.log("profile, exercise, total" , profile, exercise, total);
    set(exerciseRef, parseInt(total)).catch((error) => {
        console.error("Error updating exercise:", error);
    });
    loadExercises(profile);
}



// Function to delete an exercise from a profile
function deleteExercise(profile, exercise) {
    const exerciseRef = ref(db, `profiles/${profile}/exercises/${exercise}`);
    remove(exerciseRef).then(() => {
        loadExercises(profile);
        loadLogs(profile);
        loadResetLogs(profile);
    }).catch((error) => {
        console.error("Error deleting exercise:", error);
    });
}

function resetExercises(profile) {
    const dbRef = ref(db, `profiles/${profile}/exercises/`);
    get(dbRef).then(snapshot => {
        const exercises = {};
        //creat a variable to collect data
        var exercisesFullyLog = {} ;
        snapshot.forEach(exerciseSnapshot => {
            const exercise = exerciseSnapshot.val();
            const exerciseKey = exerciseSnapshot.key;
            //collect the data 
            
            exercisesFullyLog[exerciseKey]  = exercise;
            console.log("exercisesFullyLog", exercisesFullyLog);
            
            if (exercise.total === undefined) {
                console.error(`Exercise ${exerciseKey} has undefined total value`);
            } else {
                const newExerciseReps = {
                    remaining: exercise.total,
                    total: exercise.total
                };
                exercises[exerciseKey] = newExerciseReps;
            }
        });
        // set the data in new log
        console.log("exercises", exercises);
        // Set the exercises for the new profile
         set(ref(db, `profiles/${profile}/exercises`), exercises);
         const ddate = new Date().getTime();
         set(ref(db, `profiles/${profile}/exercisesLogs/${ddate}`), exercisesFullyLog);
         loadExercises(profile);
    }).then(() => {
        // Reload profiles and exercise data
        loadExercises(profile);
        document.getElementById("new-profile-name").value = '';
    }).catch(error => {
        console.error("Error adding profile:", error);
    });
}

// Function to load exercises for a selected profile
function loadLogs(profile) {
    const dbRef = ref(db, `profiles/${profile}/logs`);
    setActiveProfile(profile);
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
                if(newCount < 0){
                    newCount = newCount * -1;
                    isExtra = 'Extra: ';
                    color = 'green';
                }
               
                tbody.innerHTML +=  `
                    
                        <tr>
                            <th scope="row">${date}</th>
                            <th scope="row">${exercise} ${descr}</th>
                            <th scope="row">${currentCount}</th>
                            <th scope="row">${reduced}</th>
                            <th scope="row"><span style="color:${color};">${isExtra}${newCount}</span></th>
                        
                        </tr>
                `;
            }
            
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

function loadResetLogs(profile) {
    console.log("inside loadResetLogs");
    const dbRef = ref(db, `profiles/${profile}/exercisesLogs`);
    setActiveProfile(profile);
    get(dbRef).then((snapshot) => {
        if (snapshot.exists()) {
            const logs = snapshot.val();
            console.log("logs: ", logs);
            const logsList = document.getElementById("log-rest-list");
            logsList.innerHTML = '';
            const logsListLabel = document.getElementById("log-rest-list-label");
            logsListLabel.innerHTML = 'Logs for Selected Profile Before rest';
            // Convert logs object to array and sort by date in descending order (newest to oldest)
            const logsArray = Object.entries(logs).map(([key, log]) => ({ key, ...log }));
            console.log("logsArray", logsArray);

            const div = document.createElement('table'); // Use 'div' instead of 'table' for container
            div.classList.add('table', 'table-striped');

            div.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Exercise</th>
                            <th scope="col">Remaining</th>
                            <th scope="col">Total</th>
                        </tr>
                    </thead>
                    <tbody id="log-table-body">
                    </tbody>
                </table>
            `;

            const tbody = div.querySelector('#log-table-body');

            for (let log of logsArray) {
                const date = new Date(parseInt(log.key)).toLocaleString(); // Parse key as timestamp
                for (const [exercise, details] of Object.entries(log)) {
                    if (exercise === 'key') continue; // Skip the 'key' property
                    
                    const total = details.total || '';
                    let remaining = details.remaining || '';
                    let descr = "";
                    let color = 'red';
                    let isExtra = '';

                    if (exercise === "running") {
                        remaining = remaining.toFixed(2);
                        descr = "(Km)";
                    } else if (exercise === "jump jack") {
                        descr = " (Minutes)";
                    }

                    if (remaining < 0) {
                        remaining = remaining * -1;
                        isExtra = 'Extra: ';
                        color = 'green';
                    }

                    tbody.innerHTML += `
                        <tr>
                            <td>${date}</td>
                            <td>${exercise} ${descr}</td>
                            <td><span style="color:${color};">${isExtra}${remaining}</span></td>
                            <td>${total}</td>
                        </tr>
                    `;
                }
            }
            logsList.appendChild(div);
        } else {
            const logsList = document.getElementById("log-rest-list");
            logsList.innerHTML = '';
            const logsListLabel = document.getElementById("log-rest-list-label");
            logsListLabel.innerHTML = '';
            console.log("No logs available for this profile");
        }
    }).catch((error) => {
        console.error(error);
    });
}





// Attach functions to the window object to make them globally accessible
window.addProfile = addProfile;
window.deleteProfile = deleteProfile;
window.setActiveProfile = setActiveProfile;
window.loadExercises = loadExercises;
window.loadLogs = loadLogs;
window.loadResetLogs = loadResetLogs;
window.addExercise = addExercise;
window.updateExercise = updateExercise;
window.updateExerciseTotal = updateExerciseTotal;
window.deleteExercise = deleteExercise;
window.resetExercises = resetExercises;

// Initial load of profiles after authentication
document.addEventListener("DOMContentLoaded", () => {
    authenticate();
});


