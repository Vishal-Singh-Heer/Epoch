import React, {useState, useEffect} from 'react';
import '../styles/Feed.css';
import {Spinner} from "./Spinner";
import Post from "./Post";
import {
    getAllUserPosts,
    getFollowedUsersPost,
    getAllHashtagPosts,
    getFavoritePosts,
    deletePost
} from '../services/post.js'
import {useRef} from "react";
import {useInView} from "react-intersection-observer";
import { useCallback } from 'react';
import {animated, useSpring} from "react-spring";
import PopupUserList from "./PopupUserList";
import PostPopup from "./PostPopup";

export default function Feed({
                                 feedUsername,
                                 feedUserId,
                                 isInProfile,
                                 currentUser,
                                 showNewPostPopup,
                                 setShowNewPostPopup,
                                 refreshFeed,
                                 setRefreshFeed,
                                 viewingOnly,
                                 posts,
                                 isInFavorites,
                                 isInHashtags,
                                 hashtag
                             }) {

    const [isLoading, setIsLoading] = useState(true);
    const [feedPosts, setFeedPosts] = useState([]);
    const [noMorePosts, setNoMorePosts] = useState(false);
    const [firstRender, setFirstRender] = useState(true);
    const [loadingTop, setLoadingTop] = useState(true);
    const [allowScrollToTop, setAllowScrollToTop] = useState(false);
    const [noMoreTopPosts, setNoMoreTopPosts] = useState(false);
    const [offset, setOffset] = useState(0);
    const limit = 20; // must be bigger than toRemove
    const maxPosts = 25;
    const toRemove = 15; // Must be smaller than maxPosts
    const [previousPosts, setPreviousPosts] = useState([]);
    const bottomElementRef = useRef(null);
    const [ref, inView] = useInView({threshold: 0.1, });
    const [showDeletePostPopup, setShowDeletePostPopup] = useState(false);
    const [deletePostError, setDeletePostError] = useState(false);
    const [deletePostErrorPrompt, setDeletePostErrorPrompt] = useState('');
    const [postToDelete, setPostToDelete] = useState(-1);
    const [showFavoritedByList, setShowFavoritedByList] = useState(false);
    const [showVoteByList, setShowVoteByList] = useState(false);
    const [favoritedByUsernameList, setFavoritedByUsernameList] = useState( []);
    const [voteByUsernameList, setVoteByUsernameList] = useState( []);
    const [releaseMonth, setReleaseMonth] = useState('');
    const [releaseDay, setReleaseDay] = useState(-1);
    const [releaseYear, setReleaseYear] = useState(-1);
    const [releaseHour, setReleaseHour] = useState('');
    const [releaseMinute, setReleaseMinute] = useState(-1);
    const [releaseSecond, setReleaseSecond] = useState(-1);
    const [showPostPopup, setShowPostPopup] = useState(false);
    const [fileBlob, setFileBlob] = useState(null);
    const [postToEditId, setPostToEditId] = useState(-1);
    const [postToEditCaption, setPostToEditCaption] = useState('');
    const [postToEdit, setPostToEdit] = useState({});

    const {transform: inTransformDeletePost} = useSpring({
        transform: `translateY(${showDeletePostPopup ? 0 : 100}vh)`,
        config: {duration: 300},
    });

    const {transform: outTransformDeletePost} = useSpring({
        transform: `translateY(${showDeletePostPopup ? 0 : -100}vh)`,
        config: {duration: 300},
    });

    const onDeletePost = (postId, userId) => {

        setDeletePostError(true);
        setDeletePostErrorPrompt('Deleting post...');

        deletePost(postId, userId)
            .then(() => {
                setDeletePostError(false);
                setDeletePostErrorPrompt('');
                setShowDeletePostPopup(false);
                setRefreshFeed(true);
            })
            .catch((error) => {
                setShowDeletePostPopup(true);
                setDeletePostError(true);
                setDeletePostErrorPrompt(error);

                setTimeout(() => {
                    setDeletePostError(false);
                    setDeletePostErrorPrompt('');
                }, 5000);
            });
    }

    const onNewBottomPosts = useCallback((data, finalFeedPosts, finalOffset) =>
    {
        let finalToSetFeedPosts = finalFeedPosts;

        setPreviousPosts(previousPosts.concat(finalFeedPosts.slice(0, toRemove)));
        finalToSetFeedPosts = finalToSetFeedPosts.slice(toRemove);
        finalToSetFeedPosts = finalToSetFeedPosts.concat(data);


        if(finalOffset > 0) {
            setAllowScrollToTop(true);
            setNoMoreTopPosts(false);
        }
        else
        {
            setAllowScrollToTop(false);
            setNoMoreTopPosts(true);
        }


        setFeedPosts(finalToSetFeedPosts);

        if (data.length < limit)
        {
            setNoMorePosts(true);
        }

        setOffset(finalOffset + limit)
        setIsLoading(false);
        setLoadingTop(false);

    }, [previousPosts, toRemove]);

    const onNewTopPosts = useCallback((finalOffset) =>
    {
        let finalToSetFeedPosts = feedPosts;

        if (previousPosts.length === 0)
        {
            setNoMoreTopPosts(true);
            setAllowScrollToTop(false);
            return;
        }

        let toAdd = previousPosts.slice(previousPosts.length - limit);
        let newPreviousPosts = previousPosts.slice(0, previousPosts.length - limit);
        setPreviousPosts(newPreviousPosts);

        if (toAdd.length + feedPosts.length > maxPosts)
        {
            finalToSetFeedPosts = finalToSetFeedPosts.slice(0, finalToSetFeedPosts.length - toRemove);
            finalToSetFeedPosts = toAdd.concat(finalToSetFeedPosts);
            setOffset(prevOffset => prevOffset - toRemove - toRemove);
            setNoMorePosts(false);
        }
        else
        {
            finalToSetFeedPosts = toAdd.concat(finalToSetFeedPosts);
        }

        setFeedPosts(finalToSetFeedPosts);

        if (previousPosts.length === 0)
        {
            setNoMoreTopPosts(true);
            setAllowScrollToTop(false);
        }
    }, [feedPosts, previousPosts, toRemove]);

    const refreshFeedPosts = useCallback((reset, fromTop) =>
    {

        let finalOffset = reset ? 0 : (offset);
        let finalFeedPosts = reset ? [] : feedPosts;

        if (reset)
        {
            setFeedPosts([]);
            setNoMorePosts(false);
            setNoMoreTopPosts(false);
            setAllowScrollToTop(false);
        }

        if (fromTop)
        {
            onNewTopPosts(finalOffset);
            setIsLoading(false);
            setLoadingTop(false);
            return;
        }

        if (!posts)
        {
            if (isInHashtags && hashtag)
            {
                getAllHashtagPosts(hashtag, finalOffset, limit)
                .then((data) =>
                {
                    onNewBottomPosts(data, finalFeedPosts, finalOffset);
                })
                .catch((error) =>
                {
                    console.log(error);
                    setIsLoading(false);
                    setLoadingTop(false);
                });
            }
            else if (currentUser)
            {
                if (isInFavorites)
                {
                    getFavoritePosts(currentUser.id, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
                if (isInProfile && feedUserId && currentUser.id === feedUserId)
                {
                    getAllUserPosts(currentUser.id, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
                else if (feedUserId && currentUser.id !== feedUserId)
                {
                    getAllUserPosts(feedUserId, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
                else if (!isInProfile && feedUsername && currentUser.username === feedUsername)
                {
                    getFollowedUsersPost(currentUser.id, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
            }
            else
            {
                if (feedUserId)
                {
                    getAllUserPosts(feedUserId, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
            }
        }
        else
        {
            setIsLoading(false);
            setLoadingTop(false);
            setFeedPosts(posts);
        }

        setRefreshFeed(false);
    }, [offset, feedPosts, posts, isInHashtags, hashtag, currentUser, isInFavorites, feedUserId, isInProfile, feedUsername, onNewBottomPosts, onNewTopPosts, setRefreshFeed]);

    useEffect(() => {
        if (inView && !noMorePosts && !isLoading) {
            setIsLoading(true);
            refreshFeedPosts(false, false);
        }
    }, [inView, noMorePosts, isLoading, refreshFeedPosts]);

    useEffect(() => {
        if (firstRender) {
            refreshFeedPosts(true, false);
            setFirstRender(false);
        }
    }, [firstRender, refreshFeedPosts, setFirstRender]);

    useEffect(() => {
        if (refreshFeed) {
            setIsLoading(true);
            refreshFeedPosts(true, false);
        }
    }, [refreshFeed, refreshFeedPosts]);

    return (
        <>
            {(isLoading && loadingTop) ? <Spinner className={'feed-loading'}/> : (
                <div className={'feed-wrapper'}>
                    {loadingTop && <Spinner className={'feed-loading'}/>}

                    <div className={'posts-wrapper'}>
                        {(!loadingTop && allowScrollToTop && !noMoreTopPosts) && (
                            <div className={'load-more-top-buttons-wrapper'}>
                                <button className={'reset-feed-button'} onClick={() => {
                                    setLoadingTop(true);
                                    setIsLoading(true);
                                    refreshFeedPosts(true, false);
                                }}>Refresh feed (top)
                                </button>

                                {/*<button className={'load-previous-posts-button'} onClick={() => {*/}
                                {/*    setLoadingTop(true);*/}
                                {/*    refreshFeedPosts(false, true);*/}
                                {/*}}>Load previous posts</button>*/}
                            </div>
                        )}

                        {(feedPosts.length === 0 && !isLoading) &&
                            <div className={'no-posts'}>No posts to show, follow some people or make a new post</div>}

                        {feedPosts.length > 0 && (
                            feedPosts.map((item) => (
                                <Post key={item.post_id} post={item} postViewer={currentUser}
                                      isInFavorites={isInFavorites} setDeletePostError={setDeletePostError}
                                      setDeletePostErrorPrompt={setDeletePostErrorPrompt}
                                      setShowDeletePostPopup={setShowDeletePostPopup} setPostToDelete={setPostToDelete}
                                      favoritedByUsernameList={item.favorited_by_usernames}
                                      setFavoritedByUsernameList={setFavoritedByUsernameList}
                                      setShowFavoritedByList={setShowFavoritedByList}
                                      voteByUsernameList={item.votes_by_usernames}
                                      setVoteByUsernameList={setVoteByUsernameList}
                                      setShowVoteByList={setShowVoteByList}
                                      setReleaseMonth={setReleaseMonth}
                                      setReleaseDay={setReleaseDay}
                                      setReleaseYear={setReleaseYear}
                                      setReleaseHour={setReleaseHour}
                                      setReleaseMinute={setReleaseMinute}
                                      setReleaseSecond={setReleaseSecond}
                                      setShowPostPopup={setShowPostPopup}
                                      showPostPopup={showPostPopup}
                                      setFileBlob={setFileBlob}
                                      setPostToEditId={setPostToEditId}
                                      setPostToEditCaption={setPostToEditCaption}
                                      setPostToEdit={setPostToEdit}/>

                            ))
                        )}

                        {(noMorePosts && feedPosts.length > 0) &&
                            <h3 className={'no-more-posts'}>No more posts to show</h3>}
                    </div>

                    {(currentUser && ((!isInProfile && feedUsername && currentUser.username === feedUsername) || (isInProfile && feedUserId && currentUser.id === feedUserId)) && !viewingOnly) && (
                        <button className={`new-post-button ${showNewPostPopup ? 'rotate' : ''}`}
                                onClick={() => setShowNewPostPopup(!showNewPostPopup)}>+</button>)}

                    {isLoading && (<Spinner className={'feed-loading'}/>)}
                    <div ref={bottomElementRef}/>
                    <div ref={ref}/>
                </div>
            )}

            <PopupUserList showUserListModal={showFavoritedByList} setShowUserListModal={setShowFavoritedByList}
                           popupList={favoritedByUsernameList}/>
            <PopupUserList showUserListModal={showVoteByList} setShowUserListModal={setShowVoteByList}
                           popupList={voteByUsernameList}/>

            <animated.div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: showDeletePostPopup ? inTransformDeletePost : outTransformDeletePost,
                    zIndex: 1000
                }}
            >
                <div className="delete-post-overlay" onClick={() => setShowDeletePostPopup(false)}></div>

                <div className="delete-post-modal">
                    <h3 className="delete-post-header">Are you sure you want to delete this post?</h3>
                    {deletePostError && <p className="delete-post-error">{deletePostErrorPrompt}</p>}

                    <div className={'delete-post-buttons-wrapper'}>
                        <button className="delete-post-button-no"
                                onClick={() => setShowDeletePostPopup(false)}>No
                        </button>
                        <button className="delete-post-button-yes" data-testid="delete-post-button-yes"
                                id="delete-post-button-yes"
                                onClick={() => {
                                    onDeletePost(postToDelete, currentUser.id);
                                }}>Yes
                        </button>
                    </div>
                </div>
            </animated.div>

            {(postToEdit.file) ? (
                (showPostPopup && fileBlob) &&
                <PostPopup showPopup={showPostPopup} setShowPopup={setShowPostPopup} username={currentUser.username}
               profilePic={currentUser.profile_pic_data} refreshFeed={refreshFeed}
               setRefreshFeed={setRefreshFeed} editPost={true} caption={postToEditCaption} postFile={fileBlob}
               year={releaseYear} month={releaseMonth} day={releaseDay} hour={releaseHour}
               minute={releaseMinute} second={releaseSecond}
               postId={postToEditId} userId={currentUser.id}/>
            ) : (
                (showPostPopup) &&
                <PostPopup showPopup={showPostPopup} setShowPopup={setShowPostPopup} username={currentUser.username}
               profilePic={currentUser.profile_pic_data} refreshFeed={refreshFeed}
               setRefreshFeed={setRefreshFeed} editPost={true} caption={postToEditCaption}
               year={releaseYear} month={releaseMonth} day={releaseDay} hour={releaseHour}
               minute={releaseMinute} second={releaseSecond}
               postId={postToEditId} userId={currentUser.id}/>
            )}
        </>
    )
}
