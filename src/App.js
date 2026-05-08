import React from "react";
import "./App.css";

class DeckChoice extends React.Component {
  render() {
    const { decks, currentDeckName, onAddDeck, onDeleteDeck, onSwitchDeck } =
      this.props;
    return (
      <div id="deck-choice">
        <h2>Choice Deck</h2>
        <div id="deck-select-container">
          <select
            value={currentDeckName}
            onChange={(e) => onSwitchDeck(e.target.value)}
          >
            {decks.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button onClick={onAddDeck}>Add deck</button>
          <button id="deleteDeck-btn" onClick={onDeleteDeck}>
            Delete deck
          </button>
        </div>
      </div>
    );
  }
}

class AddCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { front: "", back: "" };
  }

  handleSubmit = () => {
    if (this.state.front.trim() && this.state.back.trim()) {
      this.props.onAdd(this.state.front, this.state.back);
      this.setState({ front: "", back: "" });
    }
  };

  render() {
    return (
      <div id="add-card">
        <h2>Add card</h2>
        <div>
          <input
            type="text"
            placeholder="Front side"
            value={this.state.front}
            onChange={(e) => this.setState({ front: e.target.value })}
          />
          <input
            type="text"
            placeholder="Back side"
            value={this.state.back}
            onChange={(e) => this.setState({ back: e.target.value })}
          />
          <button onClick={this.handleSubmit}>Add</button>
        </div>
      </div>
    );
  }
}

class CardTable extends React.Component {
  render() {
    return (
      <div id="deck">
        <h2>Deck</h2>
        <table id="cards-table">
          <thead>
            <tr>
              <th>front side</th>
              <th>back side</th>
              <th>learned</th>
              <th>action</th>
            </tr>
          </thead>
          <tbody>
            {this.props.cards.map((card, index) => (
              <tr key={card.id}>
                <td>{card.front}</td>
                <td>{card.back}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={card.learned}
                    onChange={() => this.props.onToggleLearned(index)}
                  />
                </td>
                <td style={{ display: "flex", gap: "5px" }}>
                  <button
                    className="edit-btn"
                    onClick={() => this.props.onEdit(card)}
                  >
                    edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => this.props.onDelete(card.id)}
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

// --- Главный компонент приложения ---
class App extends React.Component {
  constructor(props) {
    super(props);
    this.PREFIX = "flashcards-deck-";

    // Инициализация State
    this.state = {
      decks: ["default"],
      currentDeckName: "default",
      cards: [],
      currentIndex: 0,
      isFront: true,
      studyMode: "all", 
    };
  }

  componentDidMount() {
    this.loadAllData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.cards !== this.state.cards ||
      prevState.currentDeckName !== this.state.currentDeckName
    ) {
      this.saveToStorage();
    }
  }

  // --- Логика хранилища ---
  loadAllData = () => {
    const deckNames = [];
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (key.startsWith(this.PREFIX)) {
        deckNames.push(key.replace(this.PREFIX, ""));
      }
    }

    const lastDeck = localStorage.getItem("last-used-deck") || "default";
    const savedCards = JSON.parse(
      localStorage.getItem(this.PREFIX + lastDeck) || "[]",
    );

    this.setState({
      decks: deckNames.length > 0 ? deckNames : ["default"],
      currentDeckName: lastDeck,
      cards: savedCards,
    });
  };

  saveToStorage = () => {
    localStorage.setItem(
      this.PREFIX + this.state.currentDeckName,
      JSON.stringify(this.state.cards),
    );
    localStorage.setItem("last-used-deck", this.state.currentDeckName);
  };

  handleAddCard = (front, back) => {
    const newCard = { id: Date.now(), front, back, learned: false };
    this.setState({ cards: [...this.state.cards, newCard] });
  };

  handleDeleteCard = (id) => {
    this.setState({ cards: this.state.cards.filter((c) => c.id !== id) });
  };

  handleToggleLearned = (index) => {
    const updatedCards = [...this.state.cards];
    updatedCards[index].learned = !updatedCards[index].learned;
    this.setState({ cards: updatedCards });
  };

  handleSwitchDeck = (name) => {
    const savedCards = JSON.parse(
      localStorage.getItem(this.PREFIX + name) || "[]",
    );
    this.setState({
      currentDeckName: name,
      cards: savedCards,
      currentIndex: 0,
      isFront: true,
    });
  };

  handleAddDeck = () => {
    const name = prompt("Enter the name of new deck");
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!this.state.decks.includes(trimmed)) {
        this.setState({
          decks: [...this.state.decks, trimmed],
          currentDeckName: trimmed,
          cards: [],
          currentIndex: 0,
        });
      }
    }
  };

  handleDeleteDeck = () => {
    if (this.state.currentDeckName === "default")
      return alert("Cannot delete default");

    if (window.confirm(`Delete ${this.state.currentDeckName}?`)) {
      localStorage.removeItem(this.PREFIX + this.state.currentDeckName);
      const newDecks = this.state.decks.filter(
        (d) => d !== this.state.currentDeckName,
      );
      this.setState({ decks: newDecks }, () =>
        this.handleSwitchDeck("default"),
      );
    }
  };

  handleShuffle = () => {
    const shuffled = [...this.state.cards].sort(() => Math.random() - 0.5);
    this.setState({ cards: shuffled, currentIndex: 0, isFront: true });
  };

  // --- Рендер ---
  render() {
    const { cards, studyMode, currentIndex, isFront } = this.state;
    const filteredCards =
      studyMode === "unlearned" ? cards.filter((c) => !c.learned) : cards;

    const currentCard = filteredCards[currentIndex];

    return (
      <div id="main-container">
        <h1>Flashcards (React Class Version)</h1>

        <DeckChoice
          decks={this.state.decks}
          currentDeckName={this.state.currentDeckName}
          onAddDeck={this.handleAddDeck}
          onDeleteDeck={this.handleDeleteDeck}
          onSwitchDeck={this.handleSwitchDeck}
        />

        <AddCard onAdd={this.handleAddCard} />

        <CardTable
          cards={cards}
          onDelete={this.handleDeleteCard}
          onToggleLearned={this.handleToggleLearned}
          onEdit={(card) => {
            this.handleDeleteCard(card.id);
          }}
        />

        <section id="study-mod">
          <h2>Study</h2>
          <div id="mod-choice">
            <label>
              <input
                type="radio"
                name="study-mode"
                value="all"
                checked={studyMode === "all"}
                onChange={() =>
                  this.setState({ studyMode: "all", currentIndex: 0 })
                }
              />{" "}
              All cards
            </label>
            <label>
              <input
                type="radio"
                name="study-mode"
                value="unlearned"
                checked={studyMode === "unlearned"}
                onChange={() =>
                  this.setState({ studyMode: "unlearned", currentIndex: 0 })
                }
              />{" "}
              Only unlearned
            </label>
          </div>
        </section>

        <div id="study-container">
          <div
            id="card"
            onClick={() => this.setState({ isFront: !isFront })}
            style={{ backgroundColor: isFront ? "#dcedff" : "#8cedff" }}
          >
            {currentCard
              ? isFront
                ? currentCard.front
                : currentCard.back
              : "Deck is empty"}
          </div>

          <div className="controls">
            <button
              onClick={() =>
                this.setState({
                  currentIndex: Math.max(0, currentIndex - 1),
                  isFront: true,
                })
              }
            >
              previous card
            </button>
            <span id="counter">
              {filteredCards.length > 0
                ? `${currentIndex + 1} / ${filteredCards.length}`
                : "0/0"}
            </span>
            <button
              onClick={() =>
                this.setState({
                  currentIndex: Math.min(
                    filteredCards.length - 1,
                    currentIndex + 1,
                  ),
                  isFront: true,
                })
              }
            >
              next card
            </button>
          </div>
          <button id="shuffle-btn" onClick={this.handleShuffle}>
            shuffle deck
          </button>
        </div>
      </div>
    );
  }
}

export default App;
