// Appwrite Configuration
(window as any).appwriteConfig = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6984a3df0036d1431b6e',
  databaseId: '6984b02b00220847a944',  // Update this after creating the database
  usersCollectionId: 'users'  // Update this after creating the collection
};

// Server Configuration
(window as any).serverConfig = {
  url: 'http://localhost:3000'  // Change to your production URL when deploying
};
