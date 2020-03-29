using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using SocketIO;

public class Client : MonoBehaviour{
    static SocketIOComponent socket;
    [SerializeField]Button nameSetButton;
    [SerializeField]Button guessButton;
    [SerializeField]Text gameNameText;
    [SerializeField]Text gameDetailsText;
    [SerializeField]Text scoreText;
    [SerializeField]Text hintText;
    [SerializeField]InputField inputText;
    [SerializeField]Text staticScoreText;
    [SerializeField]Text topFiveNameText;
    [SerializeField]Text topFiveScoreText;

    [SerializeField]GameObject LeaderBoard;
    private string userName;
    private bool isLeaderBoardOpen;
    // Start is called before the first frame update
    void Start(){
        socket = GetComponent<SocketIOComponent>();
        socket.On("open",OnConnected);
        socket.On("server.reply",OnServerReply);
        socket.On("scoreUpdate",OnScoreUpdate);
        socket.On("postHighScore",OnReceiveHighScore);
        userName = "";
        isLeaderBoardOpen = false;
    }

    void Update(){
        
    }

    private void OnConnected(SocketIOEvent obj){
        // Debug.Log("connected");
    }

    private void OnServerReply(SocketIOEvent obj){
        hintText.text = obj.data["hint"].ToString();
        if(obj.data["isCorrect"].ToString() == "true"){
           scoreText.text = "" + (int.Parse(scoreText.text) + 1);
        }
        Debug.Log("Server reply :" + obj.data);
    }

    private void OnScoreUpdate(SocketIOEvent obj){
        scoreText.text = obj.data["score"].ToString();
    }

    public void OnReceiveHighScore(SocketIOEvent obj){
        topFiveNameText.text = "";
        topFiveScoreText.text = "";
        JSONObject payload = obj.data["payload"];
        for(int i = 0; i < payload.Count; i++){
            Debug.Log(payload[i]["name"]);
            topFiveNameText.text += payload[i]["name"] + "\n";
            topFiveScoreText.text += payload[i]["score"] + "\n";
        }
    }

    public void OnNameSet(){
        userName = inputText.text;

        JSONObject jSONObject = new JSONObject(JSONObject.Type.OBJECT);
        jSONObject.AddField("userName", userName);

        socket.Emit("setUserName", jSONObject);
        Debug.Log("UserName set!");


        inputText.text = "";
        inputText.placeholder.GetComponent<Text>().text = "Guess!";
        gameNameText.gameObject.SetActive(false);
        gameDetailsText.gameObject.SetActive(false);
        nameSetButton.gameObject.SetActive(false);
        staticScoreText.gameObject.SetActive(true);
        guessButton.gameObject.SetActive(true);
        scoreText.text = "0";
    }

    public void OnGuess(){
        if (int.TryParse(inputText.text, out int numValue)){
            JSONObject jSONObject = new JSONObject(JSONObject.Type.OBJECT);
            jSONObject.AddField("guessedNumber", inputText.text);
            jSONObject.AddField("userName", userName);
            socket.Emit("guess", jSONObject);
            Debug.Log("Guessed!");
        }
        else{
            hintText.text = "NOT LEGIT! Try use number instead";
        }
    }

    public void OnGetHighScore(){
        if(isLeaderBoardOpen == false){
            socket.Emit("gethighscore");
            LeaderBoard.gameObject.SetActive(true);
            isLeaderBoardOpen = true;
        }else{
            LeaderBoard.gameObject.SetActive(false);
            isLeaderBoardOpen = false;
        }
    }
}
