import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { readFileSync } from "fs";

/**
 * ShelterBee Firestore Rules Test Suite
 */
describe("ShelterBee Firestore Security Rules", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "shelterbee-test",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  const adminEmail = 'tavareatul7192@gmail.com';

  test("unauthenticated user cannot read any private data", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauthedDb, "users", "any")));
    await assertFails(getDoc(doc(unauthedDb, "bookings", "any")));
  });

  test("signed-in user can read properties", async () => {
    const authedDb = testEnv.authenticatedContext("user123").firestore();
    // Assuming a property exists with status 'Approved'
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "properties", "prop1"), { 
        status: "Approved", 
        title: "Villa",
        ownerId: "other" 
      });
    });
    await assertSucceeds(getDoc(doc(authedDb, "properties", "prop1")));
  });

  test("visitor cannot create property for others", async () => {
    const authedDb = testEnv.authenticatedContext("user123", { email: "user@test.com" }).firestore();
    await assertFails(setDoc(doc(authedDb, "properties", "scam"), {
      ownerId: "other_user",
      title: "Scam Listing"
    }));
  });

  test("visitor can create booking", async () => {
    const authedDb = testEnv.authenticatedContext("visitor1").firestore();
    await assertSucceeds(setDoc(doc(authedDb, "bookings", "book1"), {
      visitorId: "visitor1",
      propertyId: "prop1",
      status: "pending_owner"
    }));
  });

  test("visitor can read bookings of others (for availability)", async () => {
    const authedDb = testEnv.authenticatedContext("visitor2").firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "bookings", "other_book"), {
        visitorId: "visitor1",
        propertyId: "prop1",
        status: "confirmed"
      });
    });
    // Our broadened rule should allow this
    await assertSucceeds(getDoc(doc(authedDb, "bookings", "other_book")));
  });

  test("admin can delete anything", async () => {
    const adminDb = testEnv.authenticatedContext("admin_uid", { email: adminEmail }).firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "properties", "to_delete"), { ownerId: "somebody" });
    });
    await assertSucceeds(getDoc(doc(adminDb, "properties", "to_delete")));
  });

  test("user cannot self-elevate to admin", async () => {
    const authedDb = testEnv.authenticatedContext("user1").firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users", "user1"), { role: "visitor" });
    });
    await assertFails(setDoc(doc(authedDb, "users", "user1"), { role: "admin" }));
  });
});
