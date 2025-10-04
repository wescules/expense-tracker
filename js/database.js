// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_J8n-q23UJjm4LWTxDkupov1crnUnHgI",
  authDomain: "expense-tracker-c1aa9.firebaseapp.com",
  databaseURL: "https://expense-tracker-c1aa9-default-rtdb.firebaseio.com",
  projectId: "expense-tracker-c1aa9",
  storageBucket: "expense-tracker-c1aa9.firebasestorage.app",
  messagingSenderId: "923674585657",
  appId: "1:923674585657:web:1000fcebf14fea01257be8",
  measurementId: "G-N18Y2EKR65",
};

const EXPENSES_COLLECTION = "expenses_collection";
const CONFIG_COLLECTION = "user_config_collection";
const CATEGORY_COLLECTION = "category_collection";
const TRANSACTION_COLLECTION = 'transaction_collection'

const username = localStorage.getItem('loggedInUsername');

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

function getCachedCategories() {
    const cachedCategories = localStorage.getItem('allCategories')
    if(cachedCategories){
        return JSON.parse(cachedCategories)
    }
}

async function getAllCategories() {
  try {
    const querySnapshot = await getDocs(collection(db, CATEGORY_COLLECTION));
    
    const categoryDoc = querySnapshot.docs[0]
    if (categoryDoc){
        const categoryData = categoryDoc.data();
        localStorage.setItem('allCategories', JSON.stringify(categoryData));
        return categoryData;
    }
    return getCachedCategories()
  } catch (error) {
    console.error("Error getting documents: ", error);
    return getCachedCategories()
  }
  return []; // Return an empty array in case of error
}

// Function to update a category
async function updateCategories(updatedFields) {
    const categoryDocId = "Myg158nkJL86cI1rMr4J" // firestore has only 1 doc in this collection
    const categoryRef = doc(db, CATEGORY_COLLECTION, categoryDocId);
    try{
        await updateDoc(categoryRef, {
            ...updatedFields, // Spread the updated fields
        });
        localStorage.setItem('allCategories', JSON.stringify(updatedFields));
        return true;
    } catch (error) {
        console.error("Error updating document: ", error);
    }
    return false
}

async function updateUserConfig() {
    try{
        const usersRef = collection(db, CONFIG_COLLECTION);
        let config = JSON.parse(localStorage.getItem('userConfig'));
        const q = query(usersRef,
            where("username", "==", username),
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            await updateDoc(userDoc.ref, {
                ...config,
            });
            console.log("Document successfully updated!");
            return true;
        }
    } catch (error) {
        console.error("Error updating document: ", error);
    }
    return false
}

async function loginUser(username, password) {
    try {
        const usersRef = collection(db, CONFIG_COLLECTION);
        const q = query(usersRef,
            where("username", "==", username),
            where("password", "==", password) // Again, highly insecure for real passwords!
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // No matching user found
            console.warn("Login failed: No matching user found in users_config.");
            return null; // Return null to indicate login failure
        } else {
            // User found! There should ideally be only one user per username.
            const userDoc = querySnapshot.docs[0]; // Get the first (and hopefully only) matching document
            const userData = userDoc.data();
            console.log("Successfully logged in user from users_config:", userData.username);

            // Here you might set a session variable or store user info locally
            // to indicate the user is logged in.
            // For now, let's pretend we store their username.
            localStorage.setItem('loggedInUsername', userData.username);
            localStorage.setItem('userConfig', JSON.stringify(userData));
            return userData; // Return user data to indicate success
        }
    } catch (error) {
        console.error("Error during custom login:", error);
        authMessageDiv.textContent = `Login failed: ${error.message}`;
        throw error;
    }
}
async function getAllExpenses() {
  try {
    const querySnapshot = await getDocs(collection(db, EXPENSES_COLLECTION));
    
    let expenseList = [];
    querySnapshot.forEach((doc) => {
      const expense = doc.data();
      expenseList.push({ id: doc.id, ...expense });
    });
    if (expenseList.length > 0){
        localStorage.setItem('allExpenses', JSON.stringify(expenseList));
    }
    return expenseList;
  } catch (error) {
    console.error("Error getting documents: ", error);
    const cachedExpenses = localStorage.getItem('allExpenses')
    if(cachedExpenses){
        return JSON.parse(cachedExpenses)
    }
  }
  return []; // Return an empty array in case of error
}

async function addTransaction(transactionType, description, amount, category, currency) {
    console.log("saving transaction")
    return await addDoc(collection(db, TRANSACTION_COLLECTION), {
            name: description,
            amount: amount,
            date: getISODateWithLocalTime(new Date().toISOString().split('T')[0]),
            transactionType: transactionType,
            category: category,
            currency: currency,
            user: username,
        });
}

async function getAllTransactions() {
  try {
    const querySnapshot = await getDocs(collection(db, TRANSACTION_COLLECTION));
    
    let transactionList = [];
    querySnapshot.forEach((doc) => {
      const transaction = doc.data();
      transactionList.push({ id: doc.id, ...transaction });
    });
    if (transactionList.length > 0){
        localStorage.setItem('transactions', JSON.stringify(transactionList));
    }
    return transactionList;
  } catch (error) {
    console.error("Error getting documents: ", error);
    const cachedTransactions = localStorage.getItem('transactions')
    if(cachedTransactions){
        return JSON.parse(cachedTransactions)
    }
  }
  return [];
}


async function addExpense(formData) {
    try {
        const transactionType = 'create';
        const [docRef, newTransaction] = await Promise.all([addDoc(collection(db, EXPENSES_COLLECTION), {
            name: formData.name,
            amount: parseFloat(formData.amount),
            date: formData.date,
            category: formData.category,
            currency: formData.currency,
            user: username
        }), addTransaction(transactionType, formData.name, parseFloat(formData.amount), formData.category, formData.currency)]);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

// Function to update an expense
async function updateExpense(documentId, updatedFields) {
    const expenseRef = doc(db, EXPENSES_COLLECTION, documentId);
    let expenseDoc = await getDoc(expenseRef);
    const transactionType = "update"
    try {
        expenseDoc = expenseDoc.data();
        console.log(expenseRef)
        await Promise.all([updateDoc(expenseRef, {
            ...updatedFields, // Spread the updated fields
        }), addTransaction(transactionType, updatedFields.name, parseFloat(updatedFields.amount), updatedFields.category, expenseDoc.currency)])
        console.log("Document successfully updated!");
        return true;
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}

// Function to delete an expense
async function deleteExpense(documentId) {
    const expenseRef = doc(db, EXPENSES_COLLECTION, documentId);
    let expenseDoc = await getDoc(expenseRef);
    const transactionType = "delete"
    try {
        expenseDoc = expenseDoc.data()
        await Promise.all([deleteDoc(expenseRef), addTransaction(transactionType, expenseDoc.name, parseFloat(expenseDoc.amount), expenseDoc.category, expenseDoc.currency)]);
        console.log("Document successfully deleted!");
        return true;
    } catch (error) {
        console.error("Error removing document: ", error);
    }
}
window.getAllExpenses = getAllExpenses;
window.addExpense = addExpense;
window.updateExpense = updateExpense;
window.deleteExpense = deleteExpense;
window.loginUser = loginUser;
window.getAllCategories = getAllCategories;
window.updateCategories = updateCategories;
window.updateUserConfig = updateUserConfig;
window.getAllTransactions = getAllTransactions;