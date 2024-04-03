import React, {useEffect, useState} from 'react';
import SmartMedia from "./SmartMedia";
import BorderColorOutlinedIcon from '@mui/icons-material/BorderColorOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import '../styles/Post.css';
import {useNavigate} from 'react-router-dom';
import {useLocation} from 'react-router-dom';
import ArrowCircleUpSharpIcon from '@mui/icons-material/ArrowCircleUpSharp';
import ArrowCircleDownSharpIcon from '@mui/icons-material/ArrowCircleDownSharp';
import {favoritePost, removeFavoritePost, votePost, removeVotePost} from "../services/post";
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

export default function Post({post, postViewer, isInFavorites, setShowDeletePostPopup, setPostToDelete, setShowFavoritedByList, setShowVoteByList, favoritedByUsernameList, voteByUsernameList, setFavoritedByUsernameList, setVoteByUsernameList, showPostPopup, setShowPostPopup, setReleaseMonth, setReleaseDay, setReleaseYear, setReleaseHour, setReleaseMinute, setReleaseSecond, setFileBlob, setPostToEditId, setPostToEditCaption, setPostToEdit}) {
    const captionCharLimit = 240;
    const timeAllowedToEditInSeconds = 30000;
    const [editable, setEditable] = useState(false);
    const [editing, setEditing] = useState(false);
    const [truncatedCaption, setTruncatedCaption] = useState((post && post.caption) ? post.caption.slice(0, captionCharLimit) + '...' : '');
    const [showFullCaption, setShowFullCaption] = useState(false);
    const navigate = useNavigate();
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayImageUrl, setOverlayImageUrl] = useState('');
    const postAdmin= postViewer && postViewer.username === post.username;
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [updating, setUpdating] = useState(false);
    const [updatingMessage, setUpdatingMessage] = useState('');
    const [favorited, setFavorited] = useState(false);
    const [favoritedByCount, setFavoritedByCount] = useState(0);
    const location = useLocation(); // Get current location
    const [showCommentsSection, setShowCommentsSection] = useState(false);
    const [vote, setVote] = useState(0);
    const [upVoted, setUpVoted] = useState(false);
    const [downVoted, setDownVoted] = useState(false);
    const [voteResult, setVoteResult] = useState(0);
    const [localFinalFavoritedByUsernameList, setLocalFinalFavoritedByUsernameList] = useState(favoritedByUsernameList);
    const [localFinalVoteByUsernameList, setLocalFinalVoteByUsernameList] = useState(voteByUsernameList);
    const [copiedMessage, setCopiedMessage] = useState('');
    const [isMobile, setIsMobile] = useState(false);


    useEffect(() => {
        let postTime = new Date(post.created_at)
        postTime = new Date(Date.UTC(postTime.getFullYear(), postTime.getMonth(), postTime.getDate(), postTime.getHours(), postTime.getMinutes(), postTime.getSeconds()));

        const timerInterval = setInterval(() => {
            const currentTime = new Date();
            const timeDifferenceInSeconds = Math.floor((currentTime - postTime) / 1000);
            setEditable(timeDifferenceInSeconds <= timeAllowedToEditInSeconds);
        }, 1000);

        return () => clearInterval(timerInterval);


    }, [post.created_at, post.release, timeAllowedToEditInSeconds]);



    useEffect(() => {
        if (!showPostPopup) {
            setUpdating(false);
            setUpdatingMessage('');
            setEditing(false);
        }
    }, [showPostPopup]);


    const handleShare = () => {
        const shareURL = `${window.location.origin}/epoch/comments/${post.post_id}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareURL)
                .then(() => {
                    setCopiedMessage('Copied!');
                    setTimeout(() => {
                        setCopiedMessage('');
                    }, 3000); 
                })
                .catch((error) => {
                    console.error('Error copying URL:', error);
                });
        } else {
            setCopiedMessage(shareURL); 
            setTimeout(() => {
                setCopiedMessage('');
            }, 2000); 
        }
    };

    const handleProfilePhotoClick = (imageUrl) => {
        setOverlayImageUrl(imageUrl);
        setShowOverlay(true);
    };

    const handlePostMediaClick = () => {
        setOverlayImageUrl(post.file);
        setShowOverlay(true);
    }

    const toggleFavorite = () => {
        if (postViewer) {
            if (favorited) {
                setFavorited(false);
                setFavoritedByCount(favoritedByCount - 1);
                removeFavoritePost(post.post_id, postViewer.id)
                    .then(() => {
                    })
                    .catch((error) => {
                        setError(true);
                        setErrorMessage(error);
                        setFavorited(true);
                        setFavoritedByCount(favoritedByCount);
                        setTimeout(() => {
                            setError(false);
                            setErrorMessage('');
                        }, 5000);
                    });
            } else {
                setFavorited(true);
                setFavoritedByCount(favoritedByCount + 1);
                favoritePost(post.post_id, postViewer.id)
                    .then(() => {
                    })
                    .catch((error) => {
                        setError(true);
                        setFavorited(false);
                        setFavoritedByCount(favoritedByCount);
                        setErrorMessage(error);
                        setTimeout(() => {
                            setError(false);
                            setErrorMessage('');
                        }, 5000);
                    });
            }

            setShowFavoritedByList(false);
        }
    }

    const closeOverlay = () => {
        setShowOverlay(false);
        setOverlayImageUrl('');
    };

    useEffect(() => {
        if (post.caption && post.caption.length > captionCharLimit) {
            setTruncatedCaption(post.caption.slice(0, captionCharLimit) + '...');
            setShowFullCaption(false);
        } else {
            setTruncatedCaption(post.caption);
            setShowFullCaption(true);
        }
    }, [post.caption]);

    const postIsInThePast = () => {
        const now = new Date();
        let postTime = new Date(post.release);
        postTime = new Date(Date.UTC(postTime.getFullYear(), postTime.getMonth(), postTime.getDate(), postTime.getHours(), postTime.getMinutes(), postTime.getSeconds()));
        return now >= postTime;
    }

    const toggleCaptionVisibility = () => {
        setShowFullCaption(!showFullCaption);
    }

    const toggleSeeLess = () => {
        setShowFullCaption(false);
    }

    const renderCaptionWithHighlights = (toRender) => {
        if (!toRender) {
            return null;
        }

        const replacedNewlines = toRender.replace(/\n/g, '<br>'); // Replace \n with <br> tags

        let regex = /(@[a-zA-Z0-9_]+)|(#\w+)|(https?:\/\/[^\s]+)/g;
        let parts = replacedNewlines.split(regex);

        let elements = parts.map((part, index) => {

            if (part) {
                if (part.startsWith('@')) {
                    return <a key={index} href={`/${part.substring(1)}`} className="hashtag">{part}</a>;
                } else if (part.startsWith('#')) {
                    return <a key={index} href={`/hashtags/${part}`} className="hashtag">{part}</a>;
                } else if (part.startsWith('http')) {
                    return <a key={index} href={part} className="hashtag">{part}</a>;
                } else {
                    return <span key={index} dangerouslySetInnerHTML={{__html: part}}></span>;
                }
            }
            else
            {
                return null;
            }
        });

        return <div>{elements}</div>;
    };

    const gotUsersMentioned = () => {
        const usernames = [];
        const regex = /@([a-zA-Z0-9_]+)/g;

        if (post.caption) {
            const matches = post.caption.match(regex);

            if (matches) {
                for (let i = 0; i < matches.length; i++) {
                    usernames.push(matches[i].substring(1));
                }
            }
        }

        return usernames;
    }

    const isPostVisible = () => {
        const usernames = gotUsersMentioned();
        let visible = false;

        if (postIsInThePast() || postAdmin) {
            if ( (isInFavorites && favorited) || !isInFavorites) {
                if (usernames.length > 0) {
                    for (let i = 0; i < usernames.length && !visible; i++) {
                        if (postViewer && postViewer.username === usernames[i]) {
                            visible = true;
                        }
                    }

                    if (!visible)
                    {
                        visible = postAdmin;
                    }
                }
                else
                {
                    visible = true;
                }
            }
        }



        return visible;
    }



    const onEditPost = async () => {
        setUpdating(true);
        setEditing(true);
        setUpdatingMessage('Loading post editor...');
        let date = new Date(post.release);
        date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
        setReleaseMonth(parseInt(date.getMonth() + 1));
        setReleaseDay(parseInt(date.getDate()));
        setReleaseYear(parseInt(date.getFullYear()));
        setReleaseMinute(parseInt(date.getMinutes()));
        setReleaseSecond(parseInt(date.getSeconds()));
        setPostToEditId(post.post_id);
        setPostToEditCaption(post.caption);

        let hour = date.getHours();
        let finalHour = (hour > 12) ? ((hour - 12) + ':00 PM') : (hour + ':00 AM');
        setReleaseHour(finalHour);

        if (post.file) {
            const file = await fetch(post.file)
            const blob = await file.blob();
            await setFileBlob(blob);
        }

        setShowPostPopup(true);
    }

    const getReleaseFormat = () => {
        let date = new Date(post.release);
        date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
        const now = new Date();
        const diff = now - date;
        const diffInSeconds = Math.floor(diff / 1000);
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        };

        if (date > now) {
            const diff = date - now;
            const diffInSeconds = Math.floor(diff / 1000);
            if (diffInSeconds < 60) {
                return "In " + Math.floor(diffInSeconds) + (Math.floor(diffInSeconds) > 1 ? " seconds" : " second");
            }

            if (diffInSeconds < 3600) {
                return "In " + Math.floor(diffInSeconds / 60) + (Math.floor(diffInSeconds / 60) > 1 ? " minutes" : " minute");
            }

            if (diffInSeconds < 86400) {
                return "In " + Math.floor(diffInSeconds / 3600) + (Math.floor(diffInSeconds / 3600) > 1 ? " hours" : " hour");
            }

            return "Scheduled for " + new Intl.DateTimeFormat('en-US', options).format(date);
        }

        if (diffInSeconds < 60) {
            return "Just now";
        }

        if (diffInSeconds < 3600) {
            return Math.floor(diffInSeconds / 60) + (Math.floor(diffInSeconds / 60) > 1 ? " minutes ago" : " minute ago");
        }

        if (diffInSeconds < 86400) {
            return Math.floor(diffInSeconds / 3600) + (Math.floor(diffInSeconds / 3600) > 1 ? " hours ago" : " hour ago");
        }

        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    const onVotePost = (postId, userId, vote, action) => {
        // there are 6 scenarios:
        // 1. user has not voted on the post and wants to upvote
        // 2. user has not voted on the post and wants to downvote
        // 3. user has upvoted the post and wants to remove the upvote
        // 4. user has downvoted the post and wants to remove the downvote
        // 5. user has downvoted the post and wants to upvote
        // 6. user has upvoted the post and wants to downvote

        setShowVoteByList(false)
        if (vote === 0 && action === 'upVote') {
            setVote(1);
            setUpVoted(true);
            setDownVoted(false);
            setVoteResult(voteResult + 1);
            votePost(postId, userId, 1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(0);
                    setUpVoted(false);
                    setDownVoted(false);
                    setVoteResult(voteResult);
                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });
        }

        if (vote === 0 && action === 'downVote') {
            setVote(-1);
            setUpVoted(false);
            setDownVoted(true);
            setVoteResult(voteResult - 1);
            votePost(postId, userId, -1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(0);
                    setUpVoted(false);
                    setDownVoted(false);
                    setVoteResult(voteResult);

                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });
        }

        if (vote === 1 && action === 'removeUpVote') {
            setVote(0);
            setUpVoted(false);
            setDownVoted(false);
            setVoteResult(voteResult - 1);
            removeVotePost(postId, userId, -1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(1);
                    setUpVoted(true);
                    setDownVoted(false);
                    setVoteResult(voteResult);

                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });
        }

        if (vote === -1 && action === 'removeDownVote') {
            setVote(0);
            setUpVoted(false);
            setDownVoted(false);
            setVoteResult(voteResult + 1);
            removeVotePost(postId, userId, 1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(-1);
                    setUpVoted(false);
                    setDownVoted(true);
                    setVoteResult(voteResult);

                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });
        }


        if (vote === -1 && action === 'upVote') {
            setVote(1);
            setUpVoted(true);
            setDownVoted(false);
            setVoteResult(voteResult + 2);

            removeVotePost(postId, userId, -1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(-1);
                    setUpVoted(false);
                    setDownVoted(true);
                    setVoteResult(voteResult);
                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });


            votePost(postId, userId, 1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(-1);
                    setUpVoted(false);
                    setDownVoted(true);
                    setVoteResult(voteResult);

                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });
        }

        if (vote === 1 && action === 'downVote') {
            setVote(-1);
            setUpVoted(false);
            setDownVoted(true);
            setVoteResult(voteResult - 2);


            removeVotePost(postId, userId, 1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(1);
                    setUpVoted(true);
                    setDownVoted(false);
                    setVoteResult(voteResult);

                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });


            votePost(postId, userId, -1)
                .then((data) => {
                })
                .catch((error) => {
                    setError(true);
                    setErrorMessage(error);
                    setVote(1);
                    setUpVoted(true);
                    setDownVoted(false);
                    setVoteResult(voteResult);

                    setTimeout(() => {
                        setError(false);
                        setErrorMessage('');
                    }, 5000);
                });
        }
    }

    useEffect(() => {

        if (postViewer && post.favorited_by.includes(postViewer.id)) {
            setFavorited(true);
        } else {
            setFavorited(false);
        }

        setFavoritedByCount(parseInt(post.favorited_by_count));

    }, [post.favorited_by, postViewer, post.favorited_by_count]);

    useEffect(() => {
        setShowCommentsSection(location.pathname.includes('/comments'));
    }, [location]);

    useEffect(() => {

        let voteResult = 0;

        if (postViewer && post.votes)
        {
            if (post.votes[postViewer.id] === 1)
            {
                setVote(1);
                setUpVoted(true);
                setDownVoted(false);
            }
            else if (post.votes[postViewer.id] === -1)
            {
                setVote(-1);
                setUpVoted(false);
                setDownVoted(true);
            }
            else
            {
                setVote(0);
                setUpVoted(false);
                setDownVoted(false);
            }

            for (let key in post.votes)
            {
                voteResult += post.votes[key];
            }
        }

        setVoteResult(voteResult);

    }, [post.votes, postViewer]);

    useEffect(() => {
        if (postViewer) {
            if (favorited && postViewer) {
                let updatedFavoritedByUsernameList = localFinalFavoritedByUsernameList.filter((user) => user.user_id !== postViewer.id);
                updatedFavoritedByUsernameList.push({username: postViewer.username, user_id: postViewer.id});

                if (JSON.stringify(updatedFavoritedByUsernameList) !== JSON.stringify(localFinalFavoritedByUsernameList)) {
                    setLocalFinalFavoritedByUsernameList(updatedFavoritedByUsernameList);
                }
            } else if (!favorited && postViewer) {
                let updatedFavoritedByUsernameList = localFinalFavoritedByUsernameList.filter((user) => user.user_id !== postViewer.id);

                if (JSON.stringify(updatedFavoritedByUsernameList) !== JSON.stringify(localFinalFavoritedByUsernameList)) {
                    setLocalFinalFavoritedByUsernameList(updatedFavoritedByUsernameList);
                }
            }
        }
    }, [favorited, localFinalFavoritedByUsernameList, postViewer, post, favoritedByCount]);

    useEffect(() => {
        if (postViewer) {
            if (vote === 0) {
                let updatedVoteByUsernameList = localFinalVoteByUsernameList.filter((user) => user.user_id !== postViewer.id);

                if (JSON.stringify(updatedVoteByUsernameList) !== JSON.stringify(localFinalVoteByUsernameList)) {
                    setLocalFinalVoteByUsernameList(updatedVoteByUsernameList);
                }
            } else if (vote === 1) {
                let updatedVoteByUsernameList = localFinalVoteByUsernameList.filter((user) => user.user_id !== postViewer.id);
                updatedVoteByUsernameList.push({user_id: postViewer.id, username: postViewer.username, vote: 1});

                if (JSON.stringify(updatedVoteByUsernameList) !== JSON.stringify(localFinalVoteByUsernameList)) {
                    setLocalFinalVoteByUsernameList(updatedVoteByUsernameList);
                }
            } else {
                let updatedVoteByUsernameList = localFinalVoteByUsernameList.filter((user) => user.user_id !== postViewer.id);
                updatedVoteByUsernameList.push({user_id: postViewer.id, username: postViewer.username, vote: -1});

                if (JSON.stringify(updatedVoteByUsernameList) !== JSON.stringify(localFinalVoteByUsernameList)) {
                    setLocalFinalVoteByUsernameList(updatedVoteByUsernameList);
                }
            }
        }
    }, [vote, localFinalVoteByUsernameList, postViewer, post, voteResult]);

    const navigateToProfile = () => {
        if (postAdmin){
            navigate(`/profile`);
        } else {
            navigate(`/${post.username}`);
        }
    }

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className={`post ${showFullCaption ? 'post-expanded' : ''}`}
             style={{display: ( isPostVisible() ) ? 'block' : 'none'}}>
            <div className="post-header">
                <div className="post-header-left">
                    <div className={'profile-photo-container'}
                         onClick={() => handleProfilePhotoClick(post.profile_picture)}>
                        <SmartMedia fileUrl={post.profile_picture} file_type={post.profile_picture_type}
                                    file_name={post.profile_picture_name} alt="Profile" className="profile-photo"/>
                    </div>
                    <div className="post-header-info">
                        <h3 className={'post-username'}
                            onClick={() => navigateToProfile()}>{post.username}</h3>
                        <p className={'post-date'}>{getReleaseFormat()}</p>
                    </div>
                </div>

                <div className="post-header-right">
                    {updating && (<p className="updating-message">{updatingMessage}</p>)}
                    {copiedMessage && (
                        <div className={'copied-message'}>
                            {copiedMessage}
                        </div>
                    )}
                    {error && (<p className="error-message">{errorMessage}</p>)}
                    {(postViewer && postAdmin && editable && !editing) && (
                        <BorderColorOutlinedIcon className="edit-post-button-icon" onClick={() => {
                            setPostToEdit(post);
                            onEditPost();
                        }}
                        sx={{width: (isMobile ? '1rem' : '1.5rem'), height: (isMobile ? '1rem' : '1.5rem')}}
                        ></BorderColorOutlinedIcon>)}
                    {(postViewer && postAdmin && !editing) && (
                        <DeleteForeverOutlinedIcon className="delete-post-button-icon" onClick={() => {
                            setShowDeletePostPopup(true);
                            setPostToDelete(post.post_id);
                        }}
                        sx={{width: (isMobile ? '1rem' : '1.5rem'), height: (isMobile ? '1rem' : '1.5rem')}}
                        ></DeleteForeverOutlinedIcon>)}


                </div>
            </div>

            <div className="post-body">
                {post.caption && post.caption.length > 0 && (
                    <p className={"post-caption"} >
                        {(showFullCaption && post.caption) ? renderCaptionWithHighlights(post.caption) : (
                            < >
                                {renderCaptionWithHighlights(truncatedCaption)}
                                <span className="see-more" onClick={toggleCaptionVisibility}>
                                    See more
                                </span>
                            </>
                        )}
                        {(showFullCaption && post.caption && post.caption.length >= captionCharLimit) && (
                            <>
                                {' '}
                                <span className="see-less" onClick={toggleSeeLess}>
                                    See less
                                </span>
                            </>
                        )}
                    </p>
                )}
                {(post.file && showFullCaption) && <div className={'file-wrapper'} onClick={handlePostMediaClick}>
                    <div className={'post-file'}><SmartMedia file={post.file} fileUrl={post.file}
                                                             file_type={post.file_type}
                                                             file_name={post.file_name} className={"post-media"}/></div>
                </div>}

                <div className="post-footer">
                    {postViewer && (
                        <div className={'vote-buttons'}>
                            <ArrowCircleUpSharpIcon className={`up-vote-button ${upVoted ? 'active' : ''} custom-icon-size` }
                                                    onClick={() => {
                                                        if (vote === 1) {
                                                            onVotePost(post.post_id, postViewer.id, vote, 'removeUpVote');
                                                        } else {
                                                            onVotePost(post.post_id, postViewer.id, vote, 'upVote');
                                                        }
                                                    }}
                                                    sx={{width: (isMobile ? '1rem' : '1.5rem'), height: (isMobile ? '1rem' : '1.5rem')}}
                            ></ArrowCircleUpSharpIcon>
                            <button className={'vote-count'} onClick={() => {
                                if (localFinalVoteByUsernameList.length > 0) {
                                    setVoteByUsernameList(localFinalVoteByUsernameList);
                                    setShowFavoritedByList(false);
                                    setShowVoteByList(true);
                                }
                            }}>{voteResult}</button>
                            <ArrowCircleDownSharpIcon className={`down-vote-button ${downVoted ? 'active' : ''} custom-icon-size`}
                                                      onClick={() => {
                                                          if (vote === -1) {
                                                              onVotePost(post.post_id, postViewer.id, vote, 'removeDownVote');
                                                          } else {
                                                              onVotePost(post.post_id, postViewer.id, vote, 'downVote');
                                                          }
                                                      }}
                                                      sx={{width: (isMobile ? '1rem' : '1.5rem'), height: (isMobile ? '1rem' : '1.5rem')}}
                            ></ArrowCircleDownSharpIcon>
                        </div>
                    )}

                    {((!showCommentsSection) && postViewer) && (
                        <button className={"view-comments-button custom-icon-size"}
                                onClick={() => navigate(`/epoch/comments/${post.post_id}`)}><ForumOutlinedIcon sx={{width: (isMobile ? '1rem' : '1.5rem'), height: (isMobile ? '1rem' : '1.5rem')}}></ForumOutlinedIcon>
                        </button>
                    )}

                    {postViewer && (
                        <div className={'favorite-button-wrapper'}>
                            <FavoriteBorderOutlinedIcon className={`favorite-button ${favorited ? 'active' : ''} custom-icon-size`} sx={{width: (isMobile ? '1rem' : '1.5rem'), height: (isMobile ? '1rem' : '1.5rem')}}
                                                        onClick={() => toggleFavorite()}></FavoriteBorderOutlinedIcon>
                            <button className={'favorited-by-count'} onClick={() => {
                                if (favoritedByCount > 0){
                                    setFavoritedByUsernameList(localFinalFavoritedByUsernameList);
                                    setShowVoteByList(false);
                                    setShowFavoritedByList(true);
                                }
                            }}>
                                {favoritedByCount}</button>
                    </div>)}

                    {(
                        <div className={'share-button-wrapper'}>
                            <ShareOutlinedIcon className={'share-button custom-icon-size'} onClick={handleShare} sx={{width: (isMobile ? '1rem' : '1.5rem'), height: (isMobile ? '1rem' : '1.5rem')}}
                            ></ShareOutlinedIcon>
                        </div>
                    )}

                </div>

                {showOverlay && (
                    <div className={'post-full-size-profile-photo-overlay'} onClick={closeOverlay}>
                        <img src={overlayImageUrl} alt="Full Size" className="full-size-image"/>
                    </div>
                )}
            </div>
        </div>
    );
}
