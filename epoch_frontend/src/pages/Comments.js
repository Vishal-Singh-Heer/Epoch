import React, {useEffect, useState, useContext} from 'react'
import {Spinner} from '../modules/Spinner';
import {getAllComments} from '../services/comments'
import NavBar from "../modules/NavBar";
import PostPopup from "../modules/PostPopup";
import {useLocation} from 'react-router-dom';
import Comment from '../modules/Comment';
import '../styles/PostComments.css'
import {UserContext} from '../services/UserContext';
import {getUserInfo} from "../services/user";
import CommentPopup from "../modules/CommentPopup";
import {useNavigate} from "react-router-dom";
import NoSessionNavBar from "../modules/NoSessionNavBar";
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Feed from "../modules/Feed";


function Comments() {
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true)
    const [postId, setPostId] = useState(-1);
    const [comments, setComments] = useState([]);
    const [commentsPost, setCommentsPost] = useState(null);
    const [refreshFeed, setRefreshFeed] = useState(false);
    const {user} = useContext(UserContext);
    const {updateUser} = useContext(UserContext);
    const [showNewPostPopup, setShowNewPostPopup] = useState(false);
    const [showNewCommentPopup, setShowNewCommentPopup] = useState(false);
    const [refreshComments, setRefreshComments] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            setIsLoading(true);
            getUserInfo()
                .then(data => {
                    updateUser(data);
                })
                .catch(error => {
                    updateUser(null);
                });

        }


    }, [setIsLoading, updateUser, user]);

    useEffect(() => {
        if (refreshComments) {
            setIsLoading(true);
            getAllComments(postId)
                .then(data => {
                    setCommentsPost(data.post);
                    setComments(data.comments);
                    setRefreshComments(false);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.log(error)
                    setRefreshComments(false);
                    setIsLoading(false);
                    navigate('/epoch/login')
                })
        }
    }, [refreshComments, postId, navigate])

    useEffect(() => {
        setPostId(location.pathname.split('/comments/')[1]);
    }, [location])

    useEffect(() => {

        if (postId !== -1) {
            getAllComments(postId)
                .then(data => {
                    setCommentsPost(data.post);
                    setComments(data.comments);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.log(error);
                    setIsLoading(false);
                    navigate('/epoch/login')
                })
        }
    }, [postId, navigate])


    if (isLoading) {
        return <Spinner></Spinner>
    }

    return (
        <>
            {user ? (<NavBar profilePic={user.profile_pic_data} profilePicType={user.profile_pic_type}
                     showNewPostPopup={showNewCommentPopup} setShowNewPostPopup={setShowNewCommentPopup} userId={user.id}/>) : (
                <NoSessionNavBar></NoSessionNavBar>)}
            {isLoading ? (
                <Spinner/>
            ) : (
                <div className={"post-comments-page-container"}>
                    <div className={'post-comments-page'}>
                        <div className={"post-comments-page-wrapper"}>
                            <div className={"post-comments-page-feed"}>
                                <div className={'comments-post-wrapper'}>
                                    {commentsPost && (
                                        <Feed feedUsername={(user) ? user.username : null} feedUserId={commentsPost.user_id}
                                              isInProfile={false} currentUser={(user) ? user : null}
                                              showNewPostPopup={showNewPostPopup}
                                              setShowNewPostPopup={setShowNewPostPopup} refreshFeed={refreshComments}
                                              setRefreshFeed={setRefreshComments} viewingOnly={true}
                                              posts={[commentsPost]} isInFavorites={false} isInHashtags={false}
                                              hashtag={null}></Feed>
                                    )}
                                </div>

                                {user && (<button className={`new-comment-button ${showNewCommentPopup ? 'rotate' : ''}`}
                                          onClick={() => setShowNewCommentPopup(!showNewCommentPopup)}>{
                                        showNewCommentPopup ? '+' : <ForumOutlinedIcon className={"new-comment-icon"}/>
                                    }</button>)}

                                {comments && comments.length === 0 &&
                                    <div className={"no-comments"}>No comments yet</div>}

                                <div className={"comments-wrapper"}>
                                    {comments && (
                                        comments.map((newComment, index) => <Comment key={newComment.comm_id}
                                                                                     commentObject={newComment}
                                                                                     commentViewer={user ? user : null}
                                                                                     refreshComments={refreshComments}
                                                                                     setRefreshComments={setRefreshComments}></Comment>)
                                    )}
                                </div>

                            </div>


                        </div>

                    </div>
                </div>
            )}

            {user && (<PostPopup showPopup={showNewPostPopup} setShowPopup={setShowNewPostPopup} username={user.username}
                       profilePic={user.profile_pic_data} refreshFeed={refreshComments} setRefreshFeed={setRefreshComments}/>)}

            {user && (<CommentPopup showPopup={showNewCommentPopup} setShowPopup={setShowNewCommentPopup} postId={postId}
                          username={user.username} profilePic={user.profile_pic_data} refreshComments={refreshComments}
                          setRefreshComments={setRefreshComments}/>)}
        </>
    )
}

export default Comments
