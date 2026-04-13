// Purpose: Project source file used by the MzansiBuilds application.
// Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

import ConversationList from "../components/messages/ConversationList";
import DeveloperDirectory from "../components/messages/DeveloperDirectory";
import MessageComposer from "../components/messages/MessageComposer";
import ThreadMessages from "../components/messages/ThreadMessages";
import useMessagesPageData from "../hooks/useMessagesPageData";
import { useAuth } from "../hooks/useAuth";
import "../styles/messages.css";

// Handles MessagesPage.
function MessagesPage() {
  const { user } = useAuth();
  const {
    searchText,
    setSearchText,
    selectedUserId,
    selectedChatId,
    selectedUser,
    canMessageSelected,
    draft,
    setDraft,
    selectedFile,
    setSelectedFile,
    sending,
    sendError,
    showAccountPreview,
    setShowAccountPreview,
    messages,
    filteredDevelopers,
    followingSet,
    followerCounts,
    conversationRows,
    openConversation,
    openChatWithDeveloper,
    toggleFollow,
    onSend,
  } = useMessagesPageData({ user });

  return (
    <main>
      <section className="messages-layout">
        <aside className="messages-sidebar">
          <div className="messages-inbox-header">
            <h1>{user?.displayName || "Inbox"}</h1>
            <p>Direct messages</p>
          </div>

          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="developer-search"
            placeholder="Search developers"
          />

          <ConversationList
            conversationRows={conversationRows}
            selectedChatId={selectedChatId}
            onOpenConversation={openConversation}
          />

          <p className="developer-section-label">Discover developers</p>
          <DeveloperDirectory
            filteredDevelopers={filteredDevelopers}
            selectedUserId={selectedUserId}
            followingSet={followingSet}
            followerCounts={followerCounts}
            onOpenChat={openChatWithDeveloper}
            onToggleFollow={toggleFollow}
          />
        </aside>

        <div className="messages-thread">
          <header className="thread-header">
            {selectedUser ? (
              /* Thread summary and account action. */
              <div className="thread-head-main">
                <div>
                  <h2>{selectedUser.name}</h2>
                  <p>
                    {(followerCounts[selectedUser.id] || 0).toLocaleString()} followers • {selectedUser.isPrivate ? "Private account" : "Public account"}
                  </p>
                </div>
                <div className="thread-head-actions">
                  <button
                    type="button"
                    className="view-account-btn"
                    onClick={() => setShowAccountPreview((current) => !current)}
                  >
                    {showAccountPreview ? "Hide account" : "View account"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2>Select a conversation</h2>
                <p>Choose a chat from the inbox or start one with a developer.</p>
              </>
            )}
          </header>

          {selectedUser && showAccountPreview ? (
            /* Compact profile preview. */
            <section className="account-preview-card" aria-label="Selected developer account preview">
              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email || "No public email"}</p>
              <p>{selectedUser.bio || "No bio added yet."}</p>
              <small>
                {(followerCounts[selectedUser.id] || 0).toLocaleString()} followers • {selectedUser.isPrivate ? "Private account" : "Public account"}
              </small>
            </section>
          ) : null}

          <ThreadMessages messages={messages} currentUserId={user?.uid} />

          <MessageComposer
            selectedUser={selectedUser}
            canMessageSelected={canMessageSelected}
            sending={sending}
            draft={draft}
            setDraft={setDraft}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onSend={onSend}
            sendError={sendError}
          />
        </div>
      </section>
    </main>
  );
}

export default MessagesPage;
